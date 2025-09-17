import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../utils/authService';
import { emitNewDoctorRegistration } from '../utils/eventManager';

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  userRole: null
};

const authReducer = (state, action) => {
  console.log('AuthReducer: Action dispatched:', action.type, action.payload);
  switch (action.type) {
    case 'AUTH_START':
      return { 
        ...state, 
        isLoading: true, 
        error: null,
        isAuthenticated: false,
        user: null,
        userRole: null
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        userRole: action.payload.user.role
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        userRole: null
      };
    case 'PROFILE_UPDATE_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload
        // Keep user and authentication state intact
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        userRole: null
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();

  // Check for existing token on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('authToken');
      const userRole = localStorage.getItem('userRole');
      
      if (token && userRole) {
        try {
          dispatch({ type: 'AUTH_START' });
          
          // Get current user data from backend
          const sessionResponse = await authService.getSession();
          
          if (sessionResponse.success) {
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: { user: sessionResponse.user }
            });
          } else {
            // Check if token expired
            if (sessionResponse.error === 'Token expired') {
              // Clear all auth data and force logout
              localStorage.removeItem('authToken');
              localStorage.removeItem('userRole');
              localStorage.removeItem('userEmail');
              localStorage.removeItem('userName');
              localStorage.removeItem('userPhone');
              dispatch({ type: 'AUTH_LOGOUT' });
              return;
            }
            
            // If session is invalid, fallback to localStorage data temporarily
            // This helps with development when backend might not be available
            const userEmail = localStorage.getItem('userEmail');
            const userName = localStorage.getItem('userName');
            
            const user = {
              id: 'user_' + Date.now(),
              email: userEmail,
              firstName: userName ? userName.split(' ')[0] : (userRole === 'doctor' ? 'John' : 'User'),
              lastName: userName ? userName.split(' ')[1] || '' : (userRole === 'doctor' ? 'Smith' : ''),
              role: userRole,
              phone: localStorage.getItem('userPhone') || '',
              isEmailVerified: true,
              ...(userRole === 'doctor' && {
                specialization: localStorage.getItem('userSpecialization') || 'General Medicine',
                licenseNumber: localStorage.getItem('userLicense') || 'MD12345',
                department: localStorage.getItem('userDepartment') || 'Internal Medicine'
              })
            };
            
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: { user }
            });
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          dispatch({
            type: 'AUTH_FAILURE',
            payload: 'Authentication check failed'
          });
          localStorage.removeItem('authToken');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userName');
          localStorage.removeItem('userPhone');
        }
      } else {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      // Mock login for now - in production this would call the real API
      const response = await authService.signIn(email, password);
      
      if (response.success) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userRole', response.user.role);
        localStorage.setItem('userEmail', response.user.email);
        localStorage.setItem('userName', `${response.user.firstName} ${response.user.lastName}`);
        
        // Store doctor-specific information
        if (response.user.role === 'doctor') {
          localStorage.setItem('userSpecialization', response.user.specialization || 'General Medicine');
          localStorage.setItem('userLicense', response.user.licenseNumber || 'MD12345');
          localStorage.setItem('userDepartment', response.user.department || 'Internal Medicine');
        }
        
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: response.user }
        });
        
        return { success: true };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error.message || 'Login failed'
      });
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      console.log('AuthContext: Starting registration for:', userData.email);
      const response = await authService.signUp(userData.email, userData.password, userData);
      console.log('AuthContext: Registration response:', response);
      
      if (response.success) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userRole', response.user.role);
        localStorage.setItem('userEmail', response.user.email);
        localStorage.setItem('userName', `${response.user.firstName} ${response.user.lastName}`);
        localStorage.setItem('userPhone', userData.phone || '');
        
        // Store doctor-specific information
        if (response.user.role === 'doctor') {
          localStorage.setItem('userSpecialization', userData.specialization || response.user.specialization || 'General Medicine');
          localStorage.setItem('userLicense', userData.licenseNumber || response.user.licenseNumber || 'MD12345');
          localStorage.setItem('userDepartment', userData.department || response.user.department || 'Internal Medicine');
        }
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: response.user }
        });
        
        // Trigger event for admin dashboard to refresh when new doctor registers
        if (response.user.role === 'doctor') {
          emitNewDoctorRegistration(response.user);
          console.log('📢 New doctor registration event triggered');
        }
        
        console.log('AuthContext: Registration successful');
        return { success: true };
      } else {
        const errorMessage = response.message || 'Registration failed';
        console.log('AuthContext: Registration failed with message:', errorMessage);
        dispatch({
          type: 'AUTH_FAILURE',
          payload: errorMessage
        });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error.message || 'Registration failed';
      console.error('AuthContext: Registration exception:', error);
      dispatch({
        type: 'AUTH_FAILURE',
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  // Alias for register to match component usage
  const signUp = register;

  // Alias for login to match component usage  
  const signIn = login;

  const logout = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('userPhone');
      localStorage.removeItem('userSpecialization');
      localStorage.removeItem('userLicense');
      localStorage.removeItem('userDepartment');
      localStorage.removeItem('rememberMe');
      
      dispatch({ type: 'AUTH_LOGOUT' });
      navigate('/login-registration');
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const refreshUser = async () => {
    try {
      const sessionResponse = await authService.getSession();
      
      if (sessionResponse.success) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: sessionResponse.user }
        });
        return { success: true, user: sessionResponse.user };
      } else {
        console.warn('Failed to refresh user data:', sessionResponse.error);
        return { success: false, error: sessionResponse.error };
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return { success: false, error: error.message };
    }
  };

  const updateUserProfile = async (profileData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      console.log('Updating user profile:', profileData);
      
      // Call the backend API to update the profile
      const response = await authService.updateProfile(state.user.id, profileData);
      
      console.log('AuthContext - Backend response:', response);
      
      if (response.success) {
        // Use the updated user data from the backend response
        const backendUser = response.data.user; // Backend returns data.user
        const updatedUser = {
          ...state.user,
          ...backendUser,
          // Ensure nested objects are properly merged from backend response
          address: {
            ...state.user?.address,
            ...backendUser.address
          },
          emergencyContact: {
            ...state.user?.emergencyContact,
            ...backendUser.emergencyContact
          },
          medicalInfo: {
            ...state.user?.medicalInfo,
            ...backendUser.medicalInfo
          },
          professionalInfo: {
            ...state.user?.professionalInfo,
            ...backendUser.professionalInfo
          }
        };
        
        console.log('AuthContext - Original user state:', state.user);
        console.log('AuthContext - Backend user data:', backendUser);
        console.log('AuthContext - Final merged user:', updatedUser);
        
        // Update localStorage with new data from backend
        localStorage.setItem('userName', `${updatedUser.firstName} ${updatedUser.lastName}`);
        localStorage.setItem('userPhone', updatedUser.phone || '');
        
        if (updatedUser.role === 'doctor' && updatedUser.professionalInfo) {
          localStorage.setItem('userSpecialization', updatedUser.professionalInfo.specialization || 'General Medicine');
          localStorage.setItem('userLicense', updatedUser.professionalInfo.licenseNumber || 'MD12345');
          localStorage.setItem('userDepartment', updatedUser.professionalInfo.department || 'Internal Medicine');
        }
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: updatedUser }
        });
        
        console.log('Profile updated successfully on backend');
        return { success: true }; // Profile update completed successfully
      } else {
        throw new Error(response.message || 'Failed to update profile on backend');
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      
      // Handle token expiration by logging out user
      if (error.message === 'Token expired') {
        await handleLogout();
        throw new Error('Session expired. Please log in again.');
      }
      
      dispatch({
        type: 'PROFILE_UPDATE_ERROR',
        payload: error.message || 'Profile update failed'
      });
      throw error;
    }
  };

  const value = {
    ...state,
    login,
    signIn,
    register,
    signUp,
    logout,
    clearError,
    refreshUser,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
