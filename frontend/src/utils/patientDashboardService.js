// Patient Dashboard API Service
const API_BASE_URL = 'http://localhost:5000/api/patient-dashboard';

function createPatientDashboardService() {
  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  // Helper function to handle API responses
  const handleResponse = async (response) => {
    const data = await response.json();
    
    if (response.ok && data.success) {
      return { success: true, data: data.data };
    } else {
      // Handle authentication errors
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('userPhone');
        // Don't use window.location.href as it causes page reload
        // Let the AuthContext handle navigation
        throw new Error('Authentication expired. Please login again.');
      }
      
      throw new Error(data.message || `API Error: ${response.status}`);
    }
  };

  return {
    // Get dashboard overview
    async getDashboardOverview() {
      try {
        const response = await fetch(`${API_BASE_URL}/overview`, {
          headers: getAuthHeaders(),
        });
        return await handleResponse(response);
      } catch (error) {
        console.error('Dashboard overview error:', error);
        return { success: false, error: error.message };
      }
    },

    // Get patient appointments
    async getAppointments(params = {}) {
      try {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${API_BASE_URL}/appointments?${queryString}` : `${API_BASE_URL}/appointments`;
        
        const response = await fetch(url, {
          headers: getAuthHeaders(),
        });
        return await handleResponse(response);
      } catch (error) {
        console.error('Get appointments error:', error);
        return { success: false, error: error.message };
      }
    },

    // Get health records
    async getHealthRecords(params = {}) {
      try {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${API_BASE_URL}/health-records?${queryString}` : `${API_BASE_URL}/health-records`;
        
        const response = await fetch(url, {
          headers: getAuthHeaders(),
        });
        return await handleResponse(response);
      } catch (error) {
        console.error('Get health records error:', error);
        return { success: false, error: error.message };
      }
    },

    // Get health record details
    async getHealthRecordDetails(recordId) {
      try {
        const response = await fetch(`${API_BASE_URL}/health-records/${recordId}`, {
          headers: getAuthHeaders(),
        });
        return await handleResponse(response);
      } catch (error) {
        console.error('Get health record details error:', error);
        return { success: false, error: error.message };
      }
    },

    // Get prescriptions
    async getPrescriptions(params = {}) {
      try {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${API_BASE_URL}/prescriptions?${queryString}` : `${API_BASE_URL}/prescriptions`;
        
        const response = await fetch(url, {
          headers: getAuthHeaders(),
        });
        return await handleResponse(response);
      } catch (error) {
        console.error('Get prescriptions error:', error);
        return { success: false, error: error.message };
      }
    },

    // Get medical history
    async getMedicalHistory() {
      try {
        const response = await fetch(`${API_BASE_URL}/medical-history`, {
          headers: getAuthHeaders(),
        });
        return await handleResponse(response);
      } catch (error) {
        console.error('Get medical history error:', error);
        return { success: false, error: error.message };
      }
    },

    // Get notifications
    async getNotifications(params = {}) {
      try {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${API_BASE_URL}/notifications?${queryString}` : `${API_BASE_URL}/notifications`;
        
        const response = await fetch(url, {
          headers: getAuthHeaders(),
        });
        return await handleResponse(response);
      } catch (error) {
        console.error('Get notifications error:', error);
        return { success: false, error: error.message };
      }
    },

    // Mark notification as read
    async markNotificationRead(notificationId) {
      try {
        const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
          method: 'PUT',
          headers: getAuthHeaders(),
        });
        return await handleResponse(response);
      } catch (error) {
        console.error('Mark notification read error:', error);
        return { success: false, error: error.message };
      }
    },

    // Get vital signs trend
    async getVitalSignsTrend(params = {}) {
      try {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${API_BASE_URL}/vital-signs/trend?${queryString}` : `${API_BASE_URL}/vital-signs/trend`;
        
        const response = await fetch(url, {
          headers: getAuthHeaders(),
        });
        return await handleResponse(response);
      } catch (error) {
        console.error('Get vital signs trend error:', error);
        return { success: false, error: error.message };
      }
    },

    // Health summary endpoint
    async getHealthSummary() {
      try {
        const response = await fetch(`${API_BASE_URL}/health-summary`, {
          headers: getAuthHeaders(),
        });
        return await handleResponse(response);
      } catch (error) {
        console.error('Get health summary error:', error);
        return { success: false, error: error.message };
      }
    },

    // Stats endpoint
    async getStats() {
      try {
        const response = await fetch(`${API_BASE_URL}/stats`, {
          headers: getAuthHeaders(),
        });
        return await handleResponse(response);
      } catch (error) {
        console.error('Get stats error:', error);
        return { success: false, error: error.message };
      }
    },

    // Dashboard-specific methods
    async getUpcomingAppointments() {
      try {
        const response = await fetch(`${API_BASE_URL}/upcoming-appointments`, {
          headers: getAuthHeaders(),
        });
        const result = await handleResponse(response);
        return result.success ? result.data : [];
      } catch (error) {
        console.error('Get upcoming appointments error:', error);
        // Return mock data as fallback
        return [
          {
            id: 'APT001',
            doctor: 'Dr. Sarah Johnson',
            date: 'March 15, 2024',
            time: '10:30 AM',
            type: 'General Checkup',
            location: 'Room 101, Main Building',
            status: 'confirmed',
            notes: 'Annual physical examination'
          }
        ];
      }
    },

    async getHealthMetrics() {
      try {
        const response = await fetch(`${API_BASE_URL}/health-metrics`, {
          headers: getAuthHeaders(),
        });
        const result = await handleResponse(response);
        return result.success ? result.data : [];
      } catch (error) {
        console.error('Get health metrics error:', error);
        // Return mock data as fallback
        return [
          {
            type: 'blood_pressure',
            name: 'Blood Pressure',
            value: '120/80 mmHg',
            status: 'normal',
            lastUpdated: '2 hours ago',
            trend: 'stable',
            change: 'No change'
          },
          {
            type: 'heart_rate',
            name: 'Heart Rate',
            value: '72 bpm',
            status: 'normal',
            lastUpdated: '2 hours ago',
            trend: 'down',
            change: '-5 bpm'
          },
          {
            type: 'temperature',
            name: 'Temperature',
            value: '98.6°F',
            status: 'normal',
            lastUpdated: '3 hours ago',
            trend: 'stable',
            change: 'Normal'
          }
        ];
      }
    },

    async getPrescriptionStatus() {
      try {
        const response = await fetch(`${API_BASE_URL}/prescription-status`, {
          headers: getAuthHeaders(),
        });
        const result = await handleResponse(response);
        return result.success ? result.data : [];
      } catch (error) {
        console.error('Get prescription status error:', error);
        // Return mock data as fallback
        return [
          {
            medication: 'Lisinopril',
            dosage: '10mg',
            frequency: 'Once daily',
            status: 'active',
            prescribedDate: 'Feb 1, 2024',
            refillsLeft: 2,
            nextDose: 'Today 8:00 PM'
          },
          {
            medication: 'Metformin',
            dosage: '500mg',
            frequency: 'Twice daily',
            status: 'refill_needed',
            prescribedDate: 'Jan 15, 2024',
            refillsLeft: 0,
            nextDose: 'Today 6:00 PM'
          }
        ];
      }
    },

    async getRecentActivities() {
      try {
        const response = await fetch(`${API_BASE_URL}/recent-activities`, {
          headers: getAuthHeaders(),
        });
        const result = await handleResponse(response);
        return result.success ? result.data : [];
      } catch (error) {
        console.error('Get recent activities error:', error);
        // Return mock data as fallback
        return [
          {
            type: 'appointment',
            title: 'Appointment Confirmed',
            description: 'Your appointment with Dr. Sarah Johnson has been confirmed for March 15, 2024',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            status: 'confirmed',
            actionable: true
          },
          {
            type: 'test_result',
            title: 'Lab Results Available',
            description: 'Your blood work results from March 10 are now available',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            status: 'new',
            actionable: true
          },
          {
            type: 'prescription',
            title: 'Prescription Refill Reminder',
            description: 'Metformin prescription needs refill by March 20, 2024',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
            status: 'pending',
            actionable: true
          }
        ];
      }
    }
  };
}

const patientDashboardService = createPatientDashboardService();

export default patientDashboardService;