// AuthService for Express Backend Integration
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Mock credentials for development
const mockCredentials = {
  patient: { email: 'patient@smartclinichub.com', password: 'patient123' },
  doctor: { email: 'doctor@smartclinichub.com', password: 'doctor123' },
  admin: { email: 'admin@smartclinichub.com', password: 'admin123' }
};

// Mock user data
const mockUsers = {
  patient: {
    id: 'patient_001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'patient@smartclinichub.com',
    role: 'patient',
    phone: '+1-555-0123',
    isEmailVerified: true
  },
  doctor: {
    id: 'doctor_001',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'doctor@smartclinichub.com',
    role: 'doctor',
    phone: '+1-555-0456',
    specialization: 'Cardiology',
    isEmailVerified: true
  },
  admin: {
    id: 'admin_001',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@smartclinichub.com',
    role: 'admin',
    phone: '+1-555-0789',
    isEmailVerified: true
  }
};

const authService = {
  async signIn(email, password) {
    try {
      // Check if we should use mock authentication
      const useMock = process.env.NODE_ENV === 'development' || !process.env.REACT_APP_API_URL;
      
      if (useMock) {
        // Mock authentication
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        
        // Check against mock credentials
        let userRole = null;
        let isValidCredential = false;

        Object.entries(mockCredentials).forEach(([role, credentials]) => {
          if (email === credentials.email && password === credentials.password) {
            userRole = role;
            isValidCredential = true;
          }
        });

        if (!isValidCredential) {
          throw new Error('Invalid email or password. Please use the provided demo credentials.');
        }

        const mockToken = `jwt_token_${userRole}_${Date.now()}`;
        const user = mockUsers[userRole];

        return {
          success: true,
          message: 'Login successful',
          token: mockToken,
          user
        };
      } else {
        // Real API call
        const response = await api.post('/auth/login', { email, password });
        return response.data;
      }
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Login failed');
      } else if (error.message) {
        throw error;
      } else {
        throw new Error('Network error. Please check your connection.');
      }
    }
  },

  async signUp(email, password, userData = {}) {
    try {
      const useMock = process.env.NODE_ENV === 'development' || !process.env.REACT_APP_API_URL;
      
      if (useMock) {
        // Mock registration
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check if email already exists in mock users
        const existingUser = Object.values(mockUsers).find(user => user.email === email);
        if (existingUser) {
          throw new Error('User already exists with this email');
        }

        const role = userData.role || 'patient';
        const mockToken = `jwt_token_${role}_${Date.now()}`;
        
        const newUser = {
          id: `${role}_${Date.now()}`,
          firstName: userData.firstName || 'New',
          lastName: userData.lastName || 'User',
          email,
          role,
          phone: userData.phone || '',
          isEmailVerified: false
        };

        return {
          success: true,
          message: 'Registration successful',
          token: mockToken,
          user: newUser
        };
      } else {
        // Real API call
        const response = await api.post('/auth/register', { email, password, ...userData });
        return response.data;
      }
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Registration failed');
      } else if (error.message) {
        throw error;
      } else {
        throw new Error('Network error. Please check your connection.');
      }
    }
  },

  async signOut() {
    try {
      const useMock = process.env.NODE_ENV === 'development' || !process.env.REACT_APP_API_URL;
      
      if (!useMock) {
        await api.post('/auth/logout');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: true }; // Always return success for logout
    }
  },

  async getSession() {
    try {
      const useMock = process.env.NODE_ENV === 'development' || !process.env.REACT_APP_API_URL;
      
      if (useMock) {
        const token = localStorage.getItem('authToken');
        const userRole = localStorage.getItem('userRole');
        
        if (!token || !userRole) {
          throw new Error('No active session');
        }
        
        return {
          success: true,
          data: { user: mockUsers[userRole] }
        };
      } else {
        const response = await api.get('/auth/me');
        return response.data;
      }
    } catch (error) {
      throw new Error('Failed to get session');
    }
  },

  async getUserProfile(userId) {
    try {
      const response = await api.get(`/users/${userId}/profile`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to get user profile');
    }
  },

  async updateProfile(userId, updates) {
    try {
      const response = await api.put(`/users/${userId}/profile`, updates);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update profile');
    }
  },

  async resetPassword(email) {
    try {
      const response = await api.post('/auth/reset-password', { email });
      return response.data;
    } catch (error) {
      throw new Error('Failed to reset password');
    }
  },

  // Helper method to get mock credentials for demo
  getMockCredentials() {
    return mockCredentials;
  }
};

export default authService;
