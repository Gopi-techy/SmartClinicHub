import React from "react";
import { Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { useAuth } from "./contexts/AuthContext";
// Add your imports here
import LandingPage from "./pages/landing-page";
import LoginRegistration from "./pages/login-registration";
import AdminDashboard from "./pages/admin-dashboard";
import PatientDashboard from "./pages/patient-dashboard";
import AppointmentBooking from "./pages/appointment-booking";
import HealthRecordsManagement from "./pages/health-records-management";
import DoctorDashboard from "./pages/doctor-dashboard";
import MessagingPage from "./pages/messaging";
import AIServices from "./pages/ai-services";
import ProfilePage from "./pages/profile";
import NotFound from "./pages/NotFound";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, userRole, isLoading } = useAuth();

  console.log('🛡️ ProtectedRoute check:', { 
    isAuthenticated, 
    userRole, 
    isLoading, 
    allowedRoles,
    location: window.location.pathname
  });

  if (isLoading) {
    console.log('⏳ ProtectedRoute: Still loading auth state');
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
    console.log('❌ ProtectedRoute: Not authenticated, redirecting to login');
    return <Navigate to="/login-registration" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    console.log('🚫 ProtectedRoute: Role not allowed, redirecting to dashboard. User role:', userRole, 'Allowed:', allowedRoles);
    // Redirect to appropriate dashboard based on user role
    return <Navigate to={`/${userRole}-dashboard`} replace />;
  }

  console.log('✅ ProtectedRoute: Access granted for', userRole, 'on', window.location.pathname);
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

const HealthcareRoute = ({ children }) => {
  console.log('🏥 HealthcareRoute: Checking access for healthcare route');
  return (
    <ProtectedRoute allowedRoles={['patient', 'doctor', 'nurse']}>{children}</ProtectedRoute>
  );
};

const Routes = () => {
  const { isAuthenticated, userRole } = useAuth();

  return (
    <>
      <ScrollToTop />
      <RouterRoutes>
          {/* Public Routes */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
                <Navigate to={`/${userRole}-dashboard`} replace /> : 
                <LandingPage />
            } 
          />
          <Route path="/landing-page" element={<LandingPage />} />
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
            path="/admin-dashboard/doctor-verification" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin-dashboard/user-management" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin-dashboard/patient-management" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin-dashboard/doctor-management" 
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
          <Route 
            path="/doctor-dashboard/all-patients" 
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
            path="/messaging" 
            element={
              <HealthcareRoute>
                <MessagingPage />
              </HealthcareRoute>
            } 
          />
          <Route 
            path="/ai-services" 
            element={
              <PatientRoute>
                <AIServices />
              </PatientRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <HealthcareRoute>
                <ProfilePage />
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
    </>
  );
};

export default Routes;