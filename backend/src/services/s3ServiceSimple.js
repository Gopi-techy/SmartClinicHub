const AWS = require('aws-sdk');
const multer = require('multer');
const path = require('path');

// Load environment variables directly
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Configure AWS only if environment variables are present
let s3 = null;
let bucketName = process.env.AWS_S3_BUCKET;

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_REGION) {
  try {
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION
    });
    s3 = new AWS.S3();
    console.log('✅ AWS S3 configured successfully');
  } catch (error) {
    console.error('❌ AWS S3 configuration failed:', error.message);
  }
} else {
  console.log('⚠️ AWS S3 not configured - missing environment variables');
  console.log('Available vars:', {
    hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
    hasRegion: !!process.env.AWS_REGION,
    hasBucket: !!process.env.AWS_S3_BUCKET
  });
}

// Simple multer configuration for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow specific file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

class S3Service {
  // Check if S3 is configured
  static isConfigured() {
    return s3 !== null && bucketName;
  }

  // Check if bucket exists and create if it doesn't
  static async ensureBucket() {
    if (!this.isConfigured()) {
      throw new Error('S3 not configured. Please set AWS environment variables.');
    }

    try {
      await s3.headBucket({ Bucket: bucketName }).promise();
      console.log(`✅ S3 bucket '${bucketName}' exists`);
    } catch (error) {
      if (error.statusCode === 404) {
        console.log(`📦 Creating S3 bucket '${bucketName}'...`);
        try {
          await s3.createBucket({ 
            Bucket: bucketName,
            CreateBucketConfiguration: {
              LocationConstraint: process.env.AWS_REGION !== 'us-east-1' ? process.env.AWS_REGION : undefined
            }
          }).promise();
          console.log(`✅ S3 bucket '${bucketName}' created successfully`);
        } catch (createError) {
          console.error(`❌ Failed to create S3 bucket '${bucketName}':`, createError.message);
          throw createError;
        }
      } else {
        console.error(`❌ Error checking S3 bucket '${bucketName}':`, error.message);
        throw error;
      }
    }
  }

  // Sanitize metadata for S3 (only US-ASCII, no control characters)
  static sanitizeMetadata(metadata) {
    const sanitized = {};
    
    Object.keys(metadata).forEach(key => {
      if (metadata[key] !== null && metadata[key] !== undefined) {
        // Convert to string and remove non-ASCII and control characters
        const value = String(metadata[key])
          .replace(/[^\x20-\x7E]/g, '') // Keep only printable ASCII characters
          .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
          .trim();
        
        if (value) {
          sanitized[key] = value;
        }
      }
    });
    
    return sanitized;
  }

  // Upload file to S3
  static async uploadFile(file, userId, metadata = {}) {
    try {
      if (!this.isConfigured()) {
        throw new Error('S3 not configured. Please set AWS environment variables.');
      }

      // Ensure bucket exists
      await this.ensureBucket();

      const fileName = `health-records/${userId}/${Date.now()}-${file.originalname}`;
      
      // Sanitize metadata to ensure S3 compatibility
      const sanitizedMetadata = this.sanitizeMetadata({
        uploadedBy: userId,
        uploadDate: new Date().toISOString(),
        ...metadata
      });
      
      const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: sanitizedMetadata
      };

      const result = await s3.upload(params).promise();
      console.log(`✅ File uploaded to S3: ${fileName}`);
      
      return {
        key: result.Key,
        url: result.Location,
        bucket: result.Bucket
      };
    } catch (error) {
      console.error('❌ File upload failed:', error.message);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  // Get file from S3
  static async getFile(key) {
    try {
      if (!this.isConfigured()) {
        throw new Error('S3 not configured. Please set AWS environment variables.');
      }

      const params = {
        Bucket: bucketName,
        Key: key
      };

      const result = await s3.getObject(params).promise();
      return result;
    } catch (error) {
      console.error('❌ File retrieval failed:', error.message);
      throw new Error(`File retrieval failed: ${error.message}`);
    }
  }

  // Delete file from S3
  static async deleteFile(key) {
    try {
      if (!this.isConfigured()) {
        throw new Error('S3 not configured. Please set AWS environment variables.');
      }

      const params = {
        Bucket: bucketName,
        Key: key
      };

      await s3.deleteObject(params).promise();
      console.log(`✅ File deleted from S3: ${key}`);
      
      return { success: true, message: 'File deleted successfully' };
    } catch (error) {
      console.error('❌ File deletion failed:', error.message);
      throw new Error(`File deletion failed: ${error.message}`);
    }
  }

  // List files for a user
  static async listUserFiles(userId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('S3 not configured. Please set AWS environment variables.');
      }

      const params = {
        Bucket: bucketName,
        Prefix: `health-records/${userId}/`
      };

      const result = await s3.listObjectsV2(params).promise();
      return result.Contents || [];
    } catch (error) {
      console.error('❌ File listing failed:', error.message);
      throw new Error(`File listing failed: ${error.message}`);
    }
  }

  // Generate signed URL for secure file access
  static async getSignedUrl(key, expires = 3600) {
    try {
      if (!this.isConfigured()) {
        throw new Error('S3 not configured. Please set AWS environment variables.');
      }

      const params = {
        Bucket: bucketName,
        Key: key,
        Expires: expires
      };

      const url = await s3.getSignedUrlPromise('getObject', params);
      return url;
    } catch (error) {
      console.error('❌ Signed URL generation failed:', error.message);
      throw new Error(`Signed URL generation failed: ${error.message}`);
    }
  }

  // Copy file (for sharing between users)
  static async copyFile(sourceKey, destinationKey) {
    try {
      if (!this.isConfigured()) {
        throw new Error('S3 not configured. Please set AWS environment variables.');
      }

      const params = {
        Bucket: bucketName,
        CopySource: `${bucketName}/${sourceKey}`,
        Key: destinationKey
      };

      const result = await s3.copyObject(params).promise();
      console.log(`✅ File copied: ${sourceKey} -> ${destinationKey}`);
      
      return result;
    } catch (error) {
      console.error('❌ File copy failed:', error.message);
      throw new Error(`File copy failed: ${error.message}`);
    }
  }
}

module.exports = { S3Service, upload };