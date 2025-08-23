import React, { createContext, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserSession } from "../store/slices/authSlice";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const { user, userProfile, isLoading, isAuthenticated, error } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    // Initialize auth state by checking for existing session
    dispatch(fetchUserSession());
  }, [dispatch]);

  const value = {
    user,
    userProfile,
    loading: isLoading,
    isAuthenticated,
    authError: error,
    // Helper methods can be added here if needed
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
