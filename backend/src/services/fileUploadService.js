const { BlobServiceClient } = require('@azure/storage-blob');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs').promises;
const sharp = require('sharp');
const logger = require('../utils/logger');
const config = require('../config/config');

class FileUploadService {
  constructor() {
    // Initialize Azure Blob Service
    this.blobServiceClient = BlobServiceClient.fromConnectionString(config.azure.storageConnectionString);
    this.containerName = config.azure.containerName || 'smartclinichub';
    
    // Ensure container exists
    this.initializeContainer();

    // Configure multer for file uploads
    this.upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 10 // Maximum 10 files per request
      },
      fileFilter: this.fileFilter.bind(this)
    });
  }

  /**
   * Initialize Azure container
   */
  async initializeContainer() {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      await containerClient.createIfNotExists({
        access: 'blob'
      });
      logger.info('Azure container initialized:', this.containerName);
    } catch (error) {
      logger.error('Failed to initialize Azure container:', error);
    }
  }

  /**
   * File filter for multer
   */
  fileFilter(req, file, callback) {
    const allowedTypes = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'audio/mpeg': ['.mp3'],
      'audio/wav': ['.wav'],
      'video/mp4': ['.mp4'],
      'application/dicom': ['.dcm']
    };

    if (allowedTypes[file.mimetype]) {
      callback(null, true);
    } else {
      callback(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }

  /**
   * Generate unique filename
   */
  generateFileName(originalName, userId) {
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    const timestamp = Date.now();
    const hash = crypto.randomBytes(8).toString('hex');
    
    return `${userId}/${timestamp}_${hash}_${name}${ext}`;
  }

  /**
   * Upload file to Azure Blob Storage
   */
  async uploadToAzure(file, fileName, metadata = {}) {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      const uploadOptions = {
        blobHTTPHeaders: {
          blobContentType: file.mimetype
        },
        metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
          ...metadata
        }
      };

      await blockBlobClient.upload(file.buffer, file.buffer.length, uploadOptions);

      return {
        fileName,
        url: blockBlobClient.url,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date()
      };
    } catch (error) {
      logger.error('Azure upload failed:', error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  /**
   * Process and upload image with optimization
   */
  async uploadImage(file, userId, options = {}) {
    try {
      const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 85,
        generateThumbnail = true,
        thumbnailSize = 300
      } = options;

      // Process main image
      const processedImage = await sharp(file.buffer)
        .resize(maxWidth, maxHeight, { 
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality })
        .toBuffer();

      const mainFileName = this.generateFileName(file.originalname, userId);
      
      // Upload main image
      const mainImageResult = await this.uploadToAzure(
        { ...file, buffer: processedImage },
        mainFileName,
        { type: 'image', category: options.category || 'general' }
      );

      const results = { main: mainImageResult };

      // Generate and upload thumbnail if requested
      if (generateThumbnail) {
        const thumbnail = await sharp(file.buffer)
          .resize(thumbnailSize, thumbnailSize, { 
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 80 })
          .toBuffer();

        const thumbnailFileName = mainFileName.replace(/(\.[^.]+)$/, '_thumb$1');
        
        results.thumbnail = await this.uploadToAzure(
          { ...file, buffer: thumbnail },
          thumbnailFileName,
          { type: 'thumbnail', parentFile: mainFileName }
        );
      }

      logger.audit('Image uploaded and processed', userId, {
        fileName: mainFileName,
        originalSize: file.size,
        processedSize: processedImage.length,
        hasThumbnail: generateThumbnail
      });

      return results;
    } catch (error) {
      logger.error('Image processing failed:', error);
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  /**
   * Upload medical document
   */
  async uploadMedicalDocument(file, userId, documentType, metadata = {}) {
    try {
      const fileName = this.generateFileName(file.originalname, userId);
      
      const result = await this.uploadToAzure(file, fileName, {
        type: 'medical_document',
        documentType,
        patientId: metadata.patientId || userId,
        appointmentId: metadata.appointmentId,
        uploadedBy: metadata.uploadedBy || userId,
        confidential: true,
        ...metadata
      });

      // Log medical document upload
      logger.audit('Medical document uploaded', userId, {
        fileName,
        documentType,
        fileSize: file.size,
        patientId: metadata.patientId || userId
      });

      return result;
    } catch (error) {
      logger.error('Medical document upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload prescription document
   */
  async uploadPrescriptionDocument(file, userId, prescriptionId, metadata = {}) {
    try {
      const fileName = this.generateFileName(file.originalname, userId);
      
      const result = await this.uploadToAzure(file, fileName, {
        type: 'prescription',
        prescriptionId,
        uploadedBy: userId,
        confidential: true,
        ...metadata
      });

      logger.audit('Prescription document uploaded', userId, {
        fileName,
        prescriptionId,
        fileSize: file.size
      });

      return result;
    } catch (error) {
      logger.error('Prescription document upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(file, userId) {
    try {
      const result = await this.uploadImage(file, userId, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 90,
        generateThumbnail: true,
        thumbnailSize: 150,
        category: 'profile'
      });

      logger.audit('Profile picture uploaded', userId, {
        fileName: result.main.fileName,
        fileSize: file.size
      });

      return result;
    } catch (error) {
      logger.error('Profile picture upload failed:', error);
      throw error;
    }
  }

  /**
   * Delete file from Azure Blob Storage
   */
  async deleteFile(fileName) {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);
      
      await blockBlobClient.deleteIfExists();
      
      logger.info('File deleted from Azure:', fileName);
      return { success: true };
    } catch (error) {
      logger.error('File deletion failed:', error);
      throw new Error(`File deletion failed: ${error.message}`);
    }
  }

  /**
   * Get file download URL with expiration
   */
  async getDownloadUrl(fileName, expirationMinutes = 60) {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);
      
      // Check if file exists
      const exists = await blockBlobClient.exists();
      if (!exists) {
        throw new Error('File not found');
      }

      // Generate SAS URL for secure download
      const sasUrl = await blockBlobClient.generateSasUrl({
        permissions: 'r', // read permission
        expiresOn: new Date(Date.now() + expirationMinutes * 60 * 1000)
      });

      return {
        url: sasUrl,
        expiresAt: new Date(Date.now() + expirationMinutes * 60 * 1000)
      };
    } catch (error) {
      logger.error('Failed to generate download URL:', error);
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileName) {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);
      
      const properties = await blockBlobClient.getProperties();
      
      return {
        fileName,
        size: properties.contentLength,
        mimetype: properties.contentType,
        lastModified: properties.lastModified,
        metadata: properties.metadata
      };
    } catch (error) {
      if (error.statusCode === 404) {
        throw new Error('File not found');
      }
      logger.error('Failed to get file metadata:', error);
      throw error;
    }
  }

  /**
   * List files for a user
   */
  async listUserFiles(userId, fileType = null, limit = 50) {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const files = [];

      for await (const blob of containerClient.listBlobsFlat({
        prefix: `${userId}/`,
        includeMetadata: true
      })) {
        if (fileType && blob.metadata?.type !== fileType) {
          continue;
        }

        files.push({
          fileName: blob.name,
          size: blob.properties.contentLength,
          mimetype: blob.properties.contentType,
          uploadedAt: blob.properties.lastModified,
          metadata: blob.metadata
        });

        if (files.length >= limit) {
          break;
        }
      }

      return files;
    } catch (error) {
      logger.error('Failed to list user files:', error);
      throw error;
    }
  }

  /**
   * Create upload middleware for specific file types
   */
  createUploadMiddleware(fieldName, maxFiles = 1, fileTypes = []) {
    return this.upload.array(fieldName, maxFiles);
  }

  /**
   * Validate file before upload
   */
  validateFile(file, maxSize = 50 * 1024 * 1024, allowedTypes = []) {
    const errors = [];

    if (file.size > maxSize) {
      errors.push(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} not allowed`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Process multiple files upload
   */
  async uploadMultipleFiles(files, userId, options = {}) {
    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        let result;

        switch (options.type) {
          case 'image':
            result = await this.uploadImage(file, userId, options);
            break;
          case 'medical_document':
            result = await this.uploadMedicalDocument(file, userId, options.documentType, options.metadata);
            break;
          case 'prescription':
            result = await this.uploadPrescriptionDocument(file, userId, options.prescriptionId, options.metadata);
            break;
          default:
            const fileName = this.generateFileName(file.originalname, userId);
            result = await this.uploadToAzure(file, fileName, options.metadata);
        }

        results.push({
          originalName: file.originalname,
          success: true,
          ...result
        });
      } catch (error) {
        errors.push({
          originalName: file.originalname,
          success: false,
          error: error.message
        });
        logger.error(`Failed to upload ${file.originalname}:`, error);
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors,
      totalFiles: files.length,
      successCount: results.length,
      errorCount: errors.length
    };
  }

  /**
   * Clean up temporary files older than specified days
   */
  async cleanupOldFiles(daysOld = 30, fileType = 'temp') {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
      let deletedCount = 0;

      for await (const blob of containerClient.listBlobsFlat({
        includeMetadata: true
      })) {
        if (blob.metadata?.type === fileType && blob.properties.lastModified < cutoffDate) {
          await this.deleteFile(blob.name);
          deletedCount++;
        }
      }

      logger.info(`Cleaned up ${deletedCount} old ${fileType} files`);
      return { deletedCount };
    } catch (error) {
      logger.error('File cleanup failed:', error);
      throw error;
    }
  }
}

module.exports = new FileUploadService();
