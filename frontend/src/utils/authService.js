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

        if (response.ok && data.success) {
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
          message: error.message || 'Network error during login'
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

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registrationData),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          return {
            success: true,
            token: data.token,
            user: data.user
          };
        } else {
          // Handle validation errors with more detail
          let errorMessage = data.message || 'Registration failed';
          if (data.errors && Array.isArray(data.errors)) {
            errorMessage = data.errors.map(err => err.message).join(', ');
          }
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error('SignUp error:', error);
        return {
          success: false,
          message: error.message || 'Network error during registration'
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

        if (response.ok && data.success) {
          return {
            success: true,
            user: data.data.user
          };
        } else {
          throw new Error(data.message || 'Session validation failed');
        }
      } catch (error) {
        console.error('GetSession error:', error);
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
          throw new Error(data.message || 'Failed to update profile');
        }
      } catch (error) {
        console.error('UpdateProfile error:', error);
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
    }
  };
}

const authService = createAuthService();

export default authService;