// Auth service for SmartClinicHub backend integration
const API_BASE_URL = 'http://localhost:5000/api';

function createAuthService() {
  return {
    async signIn(email, password) {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        console.log('AuthService Login Response:', { response: response.ok, data });

        if (response.ok && data.success) {
          console.log('AuthService Login Success - User data:', data.user);
          return {
            success: true,
            token: data.token,
            user: data.user
          };
        } else {
          throw new Error(data.message || 'Login failed');
        }
      } catch (error) {
        console.error('SignIn error:', error);
        return {
          success: false,
          message: error.message || 'Login failed. Please check your connection and try again.'
        };
      }
    },

    async signUp(email, password, userData = {}) {
      try {
        const registrationData = {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email,
          password,
          phone: userData.phone,
          role: userData.role || 'patient',
          dateOfBirth: userData.dateOfBirth || '1990-01-01',
          gender: userData.gender || 'other'
        };

        console.log('AuthService: Making registration request to:', `${API_BASE_URL}/auth/register`);
        console.log('AuthService: Registration data:', registrationData);

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registrationData),
        });

        console.log('AuthService: Response status:', response.status);
        const data = await response.json();
        console.log('AuthService: Response data:', data);

        if (response.ok && data.success) {
          console.log('AuthService: Registration successful');
          return {
            success: true,
            token: data.token,
            user: data.user
          };
        } else {
          // Handle validation errors with more detail
          let errorMessage = data.message || 'Registration failed';
          
          // Handle specific error cases
          if (data.errors && Array.isArray(data.errors)) {
            errorMessage = data.errors.map(err => err.message || err.msg).join(', ');
          } else if (data.error) {
            errorMessage = data.error;
          }
          
          // Check for common error cases
          if (response.status === 409 || errorMessage.toLowerCase().includes('already exists') || errorMessage.toLowerCase().includes('already registered')) {
            errorMessage = 'This email or phone number is already registered. Please try logging in instead.';
          } else if (response.status === 400) {
            errorMessage = errorMessage || 'Please check your information and try again.';
          } else if (response.status === 429) {
            errorMessage = data.message || 'Too many requests. Please wait a moment and try again.';
          }
          
          console.log('AuthService: Registration failed with status:', response.status, 'message:', errorMessage);
          
          return {
            success: false,
            message: errorMessage
          };
        }
      } catch (error) {
        console.error('SignUp error:', error);
        
        // Always return failure for any exception
        let errorMessage = 'Registration failed. Please try again.';
        
        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection and try again.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        console.log('AuthService: Returning error:', errorMessage);
        
        return {
          success: false,
          message: errorMessage
        };
      }
    },

    async signOut() {
      try {
        const token = localStorage.getItem('authToken');
        
        if (token) {
          await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        }
        
        localStorage.removeItem('authToken');
        return { success: true };
      } catch (error) {
        console.error('SignOut error:', error);
        localStorage.removeItem('authToken');
        return { success: true }; // Still consider it successful if token is removed
      }
    },

    async getSession() {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          return { success: false, error: 'No authentication token found' };
        }
        
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        console.log('AuthService GetSession Response:', { response: response.ok, data });

        if (response.ok && data.success) {
          console.log('AuthService GetSession Success - User data:', data.data?.user);
          return {
            success: true,
            user: data.data.user
          };
        } else {
          // Check for authentication errors
          if (response.status === 401) {
            throw new Error('Token expired');
          }
          throw new Error(data.message || 'Session validation failed');
        }
      } catch (error) {
        console.error('GetSession error:', error);
        
        // Handle token expiration specifically
        if (error.message === 'Token expired' || error.message.includes('expired')) {
          return {
            success: false,
            error: 'Token expired'
          };
        }
        
        return {
          success: false,
          error: error.message || 'Network error during session check'
        };
      }
    },

    async getUserProfile(userId) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok && data.success) {
          return {
            success: true,
            data: data.data
          };
        } else {
          throw new Error(data.message || 'Failed to fetch user profile');
        }
      } catch (error) {
        console.error('GetUserProfile error:', error);
        return {
          success: false,
          message: error.message || 'Network error during profile fetch'
        };
      }
    },

    async updateProfile(userId, updates) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          return {
            success: true,
            data: data.data
          };
        } else {
          // Check for authentication errors
          if (response.status === 401) {
            throw new Error('Token expired');
          }
          
          // Log detailed error information for debugging
          console.error('Profile update failed - Status:', response.status);
          console.error('Profile update failed - Response data:', data);
          
          throw new Error(data.message || `Failed to update profile (${response.status})`);
        }
      } catch (error) {
        console.error('UpdateProfile error:', error);
        
        // Handle token expiration specifically  
        if (error.message === 'Token expired' || error.message.includes('expired')) {
          throw error; // Re-throw to be handled by AuthContext
        }
        
        return {
          success: false,
          message: error.message || 'Network error during profile update'
        };
      }
    },

    async resetPassword(email) {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          return {
            success: true,
            message: data.message || 'Password reset email sent'
          };
        } else {
          throw new Error(data.message || 'Password reset failed');
        }
      } catch (error) {
        console.error('ResetPassword error:', error);
        return {
          success: false,
          message: error.message || 'Network error during password reset'
        };
      }
    },

    async getUsers(options = {}) {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          return { success: false, error: 'No authentication token found' };
        }

        // Build query parameters
        const queryParams = new URLSearchParams();
        if (options.limit) queryParams.append('limit', options.limit);
        if (options.page) queryParams.append('page', options.page);
        if (options.role) queryParams.append('role', options.role);
        if (options.search) queryParams.append('search', options.search);

        const url = `${API_BASE_URL}/users${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        
        console.log('AuthService: Fetching users from:', url);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        console.log('AuthService GetUsers Response:', { response: response.ok, data });

        if (response.ok && data.success) {
          return {
            success: true,
            data: {
              users: data.data?.users || [],
              total: data.data?.total || 0,
              page: data.data?.page || 1,
              totalPages: data.data?.totalPages || 1
            }
          };
        } else {
          if (response.status === 401) {
            throw new Error('Token expired');
          }
          throw new Error(data.message || 'Failed to fetch users');
        }
      } catch (error) {
        console.error('GetUsers error:', error);
        return {
          success: false,
          message: error.message || 'Network error during users fetch'
        };
      }
    },

    async getDashboardMetrics() {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          return { success: false, error: 'No authentication token found' };
        }

        const response = await fetch(`${API_BASE_URL}/admin/metrics`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        console.log('AuthService getDashboardMetrics Response:', { response: response.ok, data });

        if (response.ok && data.success) {
          return {
            success: true,
            data: data.data
          };
        } else {
          if (response.status === 401) {
            throw new Error('Token expired');
          }
          throw new Error(data.message || 'Failed to fetch metrics');
        }
      } catch (error) {
        console.error('GetDashboardMetrics error:', error);
        return {
          success: false,
          message: error.message || 'Network error during metrics fetch'
        };
      }
    }
  };
}

const authService = createAuthService();

export { authService };
export default authService;