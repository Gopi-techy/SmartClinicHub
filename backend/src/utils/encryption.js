const crypto = require('crypto');
const config = require('../config/config');

class Encryption {
  constructor() {
    this.algorithm = config.encryption.algorithm;
    this.key = Buffer.from(config.encryption.key, 'utf8');
    this.ivLength = config.encryption.ivLength;
  }

  /**
   * Encrypt sensitive data
   * @param {string} text - Text to encrypt
   * @returns {string} - Encrypted text with IV prepended
   */
  encrypt(text) {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, this.key, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Combine IV, authTag, and encrypted data
      return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    } catch (error) {
      throw new Error('Encryption failed: ' + error.message);
    }
  }

  /**
   * Decrypt sensitive data
   * @param {string} encryptedData - Encrypted text with IV prepended
   * @returns {string} - Decrypted text
   */
  decrypt(encryptedData) {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipher(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed: ' + error.message);
    }
  }

  /**
   * Generate secure random token
   * @param {number} length - Token length
   * @returns {string} - Random token
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate hash for passwords
   * @param {string} password - Password to hash
   * @param {string} salt - Salt for hashing
   * @returns {string} - Hashed password
   */
  hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  }

  /**
   * Generate salt for password hashing
   * @returns {string} - Random salt
   */
  generateSalt() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create HMAC signature
   * @param {string} data - Data to sign
   * @param {string} secret - Secret key
   * @returns {string} - HMAC signature
   */
  createSignature(data, secret) {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verify HMAC signature
   * @param {string} data - Original data
   * @param {string} signature - Signature to verify
   * @param {string} secret - Secret key
   * @returns {boolean} - Verification result
   */
  verifySignature(data, signature, secret) {
    const expectedSignature = this.createSignature(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}

module.exports = new Encryption();
