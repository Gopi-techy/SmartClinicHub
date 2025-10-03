const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

// Configure AWS only if environment variables are present
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_REGION) {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  });
}

const s3 = process.env.AWS_ACCESS_KEY_ID ? new AWS.S3() : null;
const bucketName = process.env.AWS_S3_BUCKET;

// Multer S3 configuration for file uploads
const upload = s3 ? multer({
  storage: multerS3({
    s3: s3,
    bucket: bucketName,
    metadata: (req, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
        uploadedBy: req.user?.id || 'unknown',
        uploadDate: new Date().toISOString()
      });
    },
    key: (req, file, cb) => {
      const userId = req.user?.id || 'unknown';
      const fileExtension = path.extname(file.originalname);
      const fileName = `health-records/${userId}/${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    }
  }),
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
}) : multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

class S3Service {
  // Upload file to S3
  static async uploadFile(file, userId, metadata = {}) {
    try {
      if (!s3 || !bucketName) {
        throw new Error('S3 not configured. Please set AWS environment variables.');
      }

      const fileName = `health-records/${userId}/${Date.now()}-${file.originalname}`;
      
      const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          uploadedBy: userId,
          uploadDate: new Date().toISOString(),
          ...metadata
        }
      };

      const result = await s3.upload(params).promise();
      return {
        key: result.Key,
        url: result.Location,
        bucket: result.Bucket
      };
    } catch (error) {
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  // Get file from S3
  static async getFile(key) {
    try {
      const params = {
        Bucket: bucketName,
        Key: key
      };

      const result = await s3.getObject(params).promise();
      return result;
    } catch (error) {
      throw new Error(`File retrieval failed: ${error.message}`);
    }
  }

  // Delete file from S3
  static async deleteFile(key) {
    try {
      const params = {
        Bucket: bucketName,
        Key: key
      };

      await s3.deleteObject(params).promise();
      return { success: true, message: 'File deleted successfully' };
    } catch (error) {
      throw new Error(`File deletion failed: ${error.message}`);
    }
  }

  // List files for a user
  static async listUserFiles(userId) {
    try {
      const params = {
        Bucket: bucketName,
        Prefix: `health-records/${userId}/`
      };

      const result = await s3.listObjectsV2(params).promise();
      return result.Contents || [];
    } catch (error) {
      throw new Error(`File listing failed: ${error.message}`);
    }
  }

  // Generate signed URL for secure file access
  static async getSignedUrl(key, expires = 3600) {
    try {
      const params = {
        Bucket: bucketName,
        Key: key,
        Expires: expires
      };

      const url = await s3.getSignedUrlPromise('getObject', params);
      return url;
    } catch (error) {
      throw new Error(`Signed URL generation failed: ${error.message}`);
    }
  }

  // Copy file (for sharing between users)
  static async copyFile(sourceKey, destinationKey) {
    try {
      const params = {
        Bucket: bucketName,
        CopySource: `${bucketName}/${sourceKey}`,
        Key: destinationKey
      };

      const result = await s3.copyObject(params).promise();
      return result;
    } catch (error) {
      throw new Error(`File copy failed: ${error.message}`);
    }
  }
}

module.exports = { S3Service, upload };