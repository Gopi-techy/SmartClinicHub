// AWS S3 Health Records Service
// This service handles all health record operations with AWS S3 backend

const API_BASE_URL = import.meta.env.VITE_API || 'http://localhost:5000/api';

class HealthRecordsService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/health-records`;
  }

  // Get authorization headers
  getHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Get file upload headers (without Content-Type for FormData)
  getUploadHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Fetch health records for the current user
   * @param {string} userId - User ID
   * @param {string} userRole - User role (patient/doctor/admin)
   * @param {Object} filters - Optional filters (category, dateRange, etc.)
   */
  async fetchRecords(userId, userRole, filters = {}) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Use different endpoints based on user role
      const endpoint = userRole === 'doctor' ? `${this.baseURL}/all-records` : `${this.baseURL}/my-records`;
      
      const queryParams = new URLSearchParams({
        ...filters
      });

      const url = queryParams.toString() ? `${endpoint}?${queryParams}` : endpoint;
      
      const response = await fetch(url, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(`Failed to fetch records: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        records: data.records || [],
        total: data.total || 0,
        success: true
      };
    } catch (error) {
      console.error('Error fetching health records:', error);
      return {
        records: [],
        total: 0,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload a file to AWS S3
   * @param {File} file - The file to upload
   * @param {Object} metadata - File metadata
   * @param {Function} onProgress - Progress callback
   */
  async uploadFile(file, metadata, onProgress) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', metadata.userId);
      formData.append('uploadedBy', metadata.uploadedBy);
      formData.append('uploaderRole', metadata.uploaderRole);
      formData.append('category', metadata.category);
      formData.append('originalName', file.name);
      formData.append('fileType', file.type);
      formData.append('fileSize', file.size);

      // Add optional metadata
      if (metadata.patientId) {
        formData.append('patientId', metadata.patientId);
      }
      if (metadata.appointmentId) {
        formData.append('appointmentId', metadata.appointmentId);
      }
      if (metadata.notes) {
        formData.append('notes', metadata.notes);
      }

      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            const progress = Math.round((e.loaded * 100) / e.total);
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              reject(new Error('Invalid response format'));
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.open('POST', `${this.baseURL}/upload`);
        
        // Set authorization header
        const token = localStorage.getItem('authToken');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.send(formData);
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Download a health record file
   * @param {string} recordId - Record ID
   */
  async downloadRecord(recordId) {
    try {
      const response = await fetch(`${this.baseURL}/${recordId}/download`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error downloading record:', error);
      throw error;
    }
  }

  /**
   * Delete a health record
   * @param {string} recordId - Record ID
   */
  async deleteRecord(recordId) {
    try {
      const response = await fetch(`${this.baseURL}/${recordId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  }

  /**
   * Bulk download multiple records
   * @param {Array} recordIds - Array of record IDs
   */
  async bulkDownload(recordIds) {
    try {
      const response = await fetch(`${this.baseURL}/bulk-download`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ recordIds })
      });

      if (!response.ok) {
        throw new Error(`Bulk download failed: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error bulk downloading records:', error);
      throw error;
    }
  }

  /**
   * Bulk delete multiple records
   * @param {Array} recordIds - Array of record IDs
   */
  async bulkDelete(recordIds) {
    try {
      const response = await fetch(`${this.baseURL}/bulk-delete`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ recordIds })
      });

      if (!response.ok) {
        throw new Error(`Bulk delete failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error bulk deleting records:', error);
      throw error;
    }
  }

  /**
   * Share a record with another user (e.g., doctor)
   * @param {string} recordId - Record ID
   * @param {string} shareWithUserId - User ID to share with
   * @param {string} shareType - Type of sharing (view, download, etc.)
   */
  async shareRecord(recordId, shareWithUserId, shareType = 'view') {
    try {
      const response = await fetch(`${this.baseURL}/${recordId}/share`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          shareWithUserId,
          shareType,
          sharedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Share failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sharing record:', error);
      throw error;
    }
  }

  /**
   * Get record sharing information
   * @param {string} recordId - Record ID
   */
  async getRecordSharing(recordId) {
    try {
      const response = await fetch(`${this.baseURL}/${recordId}/sharing`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get sharing info: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting record sharing:', error);
      throw error;
    }
  }

  /**
   * Update record metadata
   * @param {string} recordId - Record ID
   * @param {Object} metadata - Updated metadata
   */
  async updateRecord(recordId, metadata) {
    try {
      const response = await fetch(`${this.baseURL}/${recordId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(metadata)
      });

      if (!response.ok) {
        throw new Error(`Update failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  }

  /**
   * Auto-categorize file based on name and content
   * @param {string} fileName - Original file name
   * @param {string} fileType - MIME type
   */
  detectCategory(fileName, fileType) {
    const name = fileName.toLowerCase();
    
    // Lab Results
    if (name.includes('lab') || name.includes('blood') || name.includes('test') || 
        name.includes('panel') || name.includes('results')) {
      return 'Lab Results';
    }
    
    // Prescriptions
    if (name.includes('prescription') || name.includes('medication') || 
        name.includes('rx') || name.includes('medicine')) {
      return 'Prescriptions';
    }
    
    // Imaging
    if (name.includes('xray') || name.includes('x-ray') || name.includes('mri') || 
        name.includes('scan') || name.includes('ultrasound') || name.includes('ct') ||
        name.includes('imaging') || fileType.startsWith('image/')) {
      return 'Imaging';
    }
    
    // Insurance
    if (name.includes('insurance') || name.includes('coverage') || 
        name.includes('policy') || name.includes('card')) {
      return 'Insurance';
    }
    
    // Default category
    return 'Personal Notes';
  }
}

// Export singleton instance
export default new HealthRecordsService();