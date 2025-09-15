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
        window.location.href = '/login';
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
        // Return empty data - user needs to complete profile to see appointments
        return [];
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
        // Return empty data - user needs to complete profile to see health metrics
        return [];
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
        // Return empty data - user needs to complete profile to see prescriptions
        return [];
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
        // Return empty data - user needs to complete profile to see activities
        return [];
      }
    }
  };
}

const patientDashboardService = createPatientDashboardService();

export default patientDashboardService;