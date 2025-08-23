import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import { useAuth } from "./contexts/AuthContext";
// Add your imports here
import LandingPageSimple from "pages/landing-page/LandingPageSimple";
import LoginRegistration from "pages/login-registration";
import AdminDashboard from "pages/admin-dashboard";
import PatientDashboard from "pages/patient-dashboard";
import AppointmentBooking from "pages/appointment-booking";
import HealthRecordsManagement from "pages/health-records-management";
import DoctorDashboard from "pages/doctor-dashboard";
import MessagingPage from "pages/messaging";
import NotFound from "pages/NotFound";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, userRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login-registration" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on user role
    return <Navigate to={`/${userRole}-dashboard`} replace />;
  }

  return children;
};

// Role-specific protected routes
const PatientRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['patient']}>{children}</ProtectedRoute>
);

const DoctorRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['doctor']}>{children}</ProtectedRoute>
);

const AdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>
);

const HealthcareRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['patient', 'doctor', 'nurse']}>{children}</ProtectedRoute>
);

const Routes = () => {
  const { isAuthenticated, userRole } = useAuth();

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPageSimple />} />
          <Route path="/landing-page" element={<LandingPageSimple />} />
          <Route 
            path="/login-registration" 
            element={
              isAuthenticated ? 
                <Navigate to={`/${userRole}-dashboard`} replace /> : 
                <LoginRegistration />
            } 
          />

          {/* Protected Dashboard Routes */}
          <Route 
            path="/admin-dashboard" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          <Route 
            path="/patient-dashboard" 
            element={
              <PatientRoute>
                <PatientDashboard />
              </PatientRoute>
            } 
          />
          <Route 
            path="/doctor-dashboard" 
            element={
              <DoctorRoute>
                <DoctorDashboard />
              </DoctorRoute>
            } 
          />

          {/* Protected Feature Routes */}
          <Route 
            path="/appointment-booking" 
            element={
              <HealthcareRoute>
                <AppointmentBooking />
              </HealthcareRoute>
            } 
          />
          <Route 
            path="/health-records-management" 
            element={
              <HealthcareRoute>
                <HealthRecordsManagement />
              </HealthcareRoute>
            } 
          />
          <Route 
            path="/messages" 
            element={
              <HealthcareRoute>
                <MessagingPage />
              </HealthcareRoute>
            } 
          />

          {/* Default redirect for authenticated users */}
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? 
                <Navigate to={`/${userRole}-dashboard`} replace /> : 
                <Navigate to="/login-registration" replace />
            } 
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;