import { API_BASE_URL } from '../utils/constants';

class AppointmentService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/appointments`;
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

  // Book a new appointment
  async bookAppointment(appointmentData) {
    try {
      const response = await fetch(`${this.baseURL}/book`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(appointmentData)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Book appointment error:', error);
      throw error;
    }
  }

  // Get user's appointments
  async getAppointments(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });

      const url = `${this.baseURL}?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get appointments error:', error);
      throw error;
    }
  }

  // Get appointment by ID
  async getAppointmentById(appointmentId) {
    try {
      const response = await fetch(`${this.baseURL}/${appointmentId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get appointment by ID error:', error);
      throw error;
    }
  }

  // Update appointment status
  async updateAppointmentStatus(appointmentId, status, notes = '') {
    try {
      const response = await fetch(`${this.baseURL}/${appointmentId}/status`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status, notes })
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Update appointment status error:', error);
      throw error;
    }
  }

  // Cancel appointment
  async cancelAppointment(appointmentId, reason = '') {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${this.baseURL}/${appointmentId}`, {
        method: 'DELETE',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      const result = await this.handleResponse(response);
      return result;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      throw error;
    }
  }

  // Get available time slots for a doctor on a specific date
  async getAvailableSlots(doctorId, date) {
    try {
      const response = await fetch(`${this.baseURL}/doctor/${doctorId}/slots/${date}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get available slots error:', error);
      throw error;
    }
  }

  // Get appointment statistics
  async getAppointmentStats(period = 'month') {
    try {
      const response = await fetch(`${this.baseURL}/stats?period=${period}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get appointment stats error:', error);
      throw error;
    }
  }

  // Get doctor's patients/appointments (for doctors)
  async getDoctorPatients(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });

      const url = `${this.baseURL}/doctor/patients?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get doctor patients error:', error);
      throw error;
    }
  }

  // Get all registered patients (for doctors)
  async getAllPatients(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });

      const url = `${this.baseURL}/doctor/all-patients?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get all patients error:', error);
      throw error;
    }
  }

  // Format appointment data for display
  formatAppointmentForDisplay(appointment) {
    if (!appointment) return null;

    return {
      id: appointment._id || appointment.id,
      bookingReference: appointment.bookingReference,
      date: new Date(appointment.appointmentDate).toLocaleDateString(),
      time: `${appointment.startTime} - ${appointment.endTime}`,
      status: appointment.status,
      type: appointment.type || 'consultation',
      mode: appointment.mode || 'in-person',
      doctor: appointment.doctor ? {
        id: appointment.doctor._id,
        name: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
        specialization: appointment.doctor.professionalInfo?.specialization || 'General Practice'
      } : null,
      patient: appointment.patient ? {
        id: appointment.patient._id,
        name: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        email: appointment.patient.email,
        phone: appointment.patient.phone
      } : null,
      chiefComplaint: appointment.chiefComplaint,
      symptoms: appointment.symptoms || [],
      consultationFee: appointment.consultationFee || 0,
      meetingUrl: appointment.videoCallDetails?.meetingUrl,
      canCancel: appointment.canBeCancelled,
      canReschedule: appointment.canBeRescheduled
    };
  }

  // Validate appointment data
  validateAppointmentData(data) {
    const errors = [];

    if (!data.doctorId) {
      errors.push('Doctor selection is required');
    }

    if (!data.appointmentDate) {
      errors.push('Appointment date is required');
    }

    if (!data.startTime) {
      errors.push('Appointment time is required');
    }

    if (!data.mode || !['online', 'in-person'].includes(data.mode)) {
      errors.push('Valid appointment mode is required');
    }

    if (!data.type) {
      data.type = 'consultation'; // Default value
    }

    // Check if appointment is at least 1 hour in advance
    if (data.appointmentDate && data.startTime) {
      const now = new Date();
      
      // Parse date and time properly to avoid timezone issues
      // appointmentDate format: "2025-10-02", startTime format: "09:00"
      const [year, month, day] = data.appointmentDate.split('-').map(Number);
      const [hours, minutes] = data.startTime.split(':').map(Number);
      
      // Create date in local timezone
      const appointmentDateTime = new Date(year, month - 1, day, hours, minutes, 0);
      const oneHourFromNow = new Date(now.getTime() + (60 * 60 * 1000));
      
      // Check if appointment is at least 1 hour from now
      if (appointmentDateTime.getTime() < oneHourFromNow.getTime()) {
        const hoursUntilAppointment = ((appointmentDateTime.getTime() - now.getTime()) / (60 * 60 * 1000)).toFixed(1);
        errors.push(`Appointments must be booked at least 1 hour in advance. This appointment is ${hoursUntilAppointment} hours away.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      data
    };
  }
}

// Create and export a singleton instance
const appointmentService = new AppointmentService();
export default appointmentService;