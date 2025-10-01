import { API_BASE_URL } from '../utils/constants';

class PrescriptionService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/prescriptions`;
  }

  // Helper method to get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  // Handle API response
  async handleResponse(response) {
    let data;
    const contentType = response.headers.get('content-type');
    
    try {
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }
    } catch (parseError) {
      throw new Error('Failed to parse server response');
    }
    
    if (!response.ok) {
      throw new Error(data.message || data.error || 'An error occurred');
    }
    
    return data;
  }

  // Create a new prescription
  async createPrescription(prescriptionData) {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(prescriptionData)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Create prescription error:', error);
      throw error;
    }
  }

  // Get all prescriptions for a doctor
  async getDoctorPrescriptions() {
    try {
      const response = await fetch(`${this.baseURL}/doctor`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get doctor prescriptions error:', error);
      throw error;
    }
  }

  // Get all prescriptions for a patient
  async getPatientPrescriptions(patientId) {
    try {
      const response = await fetch(`${this.baseURL}/patient/${patientId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get patient prescriptions error:', error);
      throw error;
    }
  }

  // Get a specific prescription by ID
  async getPrescription(prescriptionId) {
    try {
      const response = await fetch(`${this.baseURL}/${prescriptionId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get prescription error:', error);
      throw error;
    }
  }

  // Update a prescription
  async updatePrescription(prescriptionId, updateData) {
    try {
      const response = await fetch(`${this.baseURL}/${prescriptionId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updateData)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Update prescription error:', error);
      throw error;
    }
  }

  // Cancel a prescription
  async cancelPrescription(prescriptionId, reason) {
    try {
      const response = await fetch(`${this.baseURL}/${prescriptionId}/cancel`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ reason })
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Cancel prescription error:', error);
      throw error;
    }
  }

  // Verify a prescription using a verification code
  async verifyPrescription(verificationCode) {
    try {
      const response = await fetch(`${this.baseURL}/verify/${verificationCode}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Verify prescription error:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const prescriptionService = new PrescriptionService();
export default prescriptionService;