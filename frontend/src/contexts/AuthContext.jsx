import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../utils/authService';

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  userRole: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
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
          
          // For now, create a mock user object from localStorage
          const userEmail = localStorage.getItem('userEmail');
          const userName = localStorage.getItem('userName');
          
          const mockUser = {
            id: 'user_' + Date.now(),
            email: userEmail,
            firstName: userName ? userName.split(' ')[0] : 'User',
            lastName: userName ? userName.split(' ')[1] || '' : '',
            role: userRole,
            phone: localStorage.getItem('userPhone') || '',
            isEmailVerified: true
          };
          
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user: mockUser }
          });
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
      
      const response = await authService.signUp(userData.email, userData.password, userData);
      
      if (response.success) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userRole', response.user.role);
        localStorage.setItem('userEmail', response.user.email);
        localStorage.setItem('userName', `${response.user.firstName} ${response.user.lastName}`);
        localStorage.setItem('userPhone', userData.phone || '');
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: response.user }
        });
        
        return { success: true };
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error.message || 'Registration failed'
      });
      throw error;
    }
  };

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
      localStorage.removeItem('rememberMe');
      
      dispatch({ type: 'AUTH_LOGOUT' });
      navigate('/login-registration');
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    clearError
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
