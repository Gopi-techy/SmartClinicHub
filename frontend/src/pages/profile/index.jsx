import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import { checkProfileCompletion } from '../../utils/profileUtils';
import ProfileForm from '../../components/forms/ProfileForm';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import RoleBasedHeader from '../../components/ui/RoleBasedHeader';
import PatientSidebar from '../../components/ui/PatientSidebar';
import ProviderSidebar from '../../components/ui/ProviderSidebar';
import PatientBottomTabs from '../../components/ui/PatientBottomTabs';
import VerificationStatusBanner from '../../components/ui/VerificationStatusBanner';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  React.useEffect(() => {
    if (user) {
      const newProfileData = checkProfileCompletion(user);
      setProfileData(newProfileData);
      
      // Don't automatically hide the form when profile becomes complete
      // Users should be able to edit their complete profile
    }
  }, [user, showForm, refreshKey]);

  const handleProfileComplete = () => {
    // Force immediate refresh of profile data from updated user state
    setRefreshKey(prev => prev + 1); // Force re-render
    
    // Immediate update
    if (user) {
      const updatedProfileData = checkProfileCompletion(user);
      setProfileData(updatedProfileData);
      
      // Only hide the form if it was opened from "Complete Now" button
      // Allow users to continue editing even after reaching 100%
      if (updatedProfileData.completionPercentage === 100) {
        // Don't automatically hide form - let user decide when to close it
        console.log('Profile completed! User can continue editing or close form manually.');
      }
    }
    
    // Also do a delayed update to catch any state changes
    setTimeout(() => {
      if (user) {
        const finalProfileData = checkProfileCompletion(user);
        setProfileData(finalProfileData);
      }
    }, 100);
    
    // Navigate back to dashboard after profile completion if desired
    // Uncomment the following lines if you want to navigate away
    // const dashboardPath = user?.role === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard';
    // navigate(dashboardPath);
  };

  const handleEditProfile = () => {
    setShowForm(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <RoleBasedHeader />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Access Denied</h2>
            <p className="text-muted-foreground mb-4">Please log in to access your profile.</p>
            <Button onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Complete Profile - SmartClinicHub</title>
        </Helmet>
        
        <RoleBasedHeader />
        {user?.role === 'patient' ? <PatientSidebar /> : <ProviderSidebar />}
        {user?.role === 'patient' && <PatientBottomTabs />}
        
        <div className={`pt-16 pb-20 md:pb-8 ${user?.role === 'patient' ? 'md:ml-64' : 'md:ml-80'}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <div className="mb-6">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
                  Back to Profile Overview
                </button>
              </div>
              
              <ProfileForm onComplete={handleProfileComplete} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Profile - SmartClinicHub</title>
      </Helmet>
      
      <RoleBasedHeader />
      {user?.role === 'patient' ? <PatientSidebar /> : <ProviderSidebar />}
      {user?.role === 'patient' && <PatientBottomTabs />}
      
      <div className={`pt-16 pb-20 md:pb-8 ${user?.role === 'patient' ? 'md:ml-64' : 'md:ml-80'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-card rounded-lg border border-border p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon name="User" className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
                  <p className="text-muted-foreground">Manage your information</p>
                </div>
              </div>
              <Button onClick={handleEditProfile}>
                <Icon name="Edit" className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>

        {/* Profile Complete Badge */}
        {profileData && profileData.completionPercentage === 100 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <Icon name="CheckCircle" className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">Profile Complete!</h3>
                <p className="text-sm text-green-600">Your profile is 100% complete and ready to use.</p>
              </div>
            </div>
          </div>
        )}

        {/* Doctor Verification Status Banner */}
        <VerificationStatusBanner user={user} className="mb-6" />

        {/* Profile Completion */}
        {profileData && profileData.completionPercentage < 100 && (
          <div className="bg-card rounded-lg border border-border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Profile Completion</h3>
                <p className="text-sm text-muted-foreground">Complete your profile for better experience</p>
              </div>
              <div className={`text-2xl font-bold ${
                profileData.completionPercentage >= 80 
                  ? 'text-green-600' 
                  : profileData.completionPercentage >= 50 
                    ? 'text-yellow-600' 
                    : 'text-red-600'
              }`}>
                {profileData.completionPercentage}%
              </div>
            </div>
            
            <div className="w-full bg-secondary rounded-full h-2 mb-4">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  profileData.completionPercentage >= 80 
                    ? 'bg-green-500' 
                    : profileData.completionPercentage >= 50 
                      ? 'bg-yellow-500' 
                      : 'bg-red-500'
                }`}
                style={{ width: `${profileData.completionPercentage}%` }}
              ></div>
            </div>
            
            {profileData.missingFields.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Missing: {profileData.missingFields.slice(0, 3).join(', ')}
                  {profileData.missingFields.length > 3 && ` and ${profileData.missingFields.length - 3} more`}
                </div>
                <Button onClick={handleEditProfile} size="sm">
                  <Icon name="CheckCircle" className="w-4 h-4 mr-2" />
                  Complete Now
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Profile Information */}
        <div className="space-y-6">
          {/* Personal Information */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Name</label>
                <p className="text-foreground font-medium">{user.firstName || 'Not provided'} {user.lastName || ''}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                <p className="text-foreground font-medium">{user.email}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Phone</label>
                <p className="text-foreground font-medium">{user.phone || 'Not provided'}</p>
              </div>
              {user.role === 'patient' && (
                <>
                  <div>
                    <label className="text-sm text-muted-foreground">Date of Birth</label>
                    <p className="text-foreground font-medium">
                      {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Gender</label>
                    <p className="text-foreground font-medium capitalize">{user.gender || 'Not provided'}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Address</h3>
            {user.address ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Street</label>
                  <p className="text-foreground font-medium">{user.address.street || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">City</label>
                  <p className="text-foreground font-medium">{user.address.city || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">State</label>
                  <p className="text-foreground font-medium">{user.address.state || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">ZIP Code</label>
                  <p className="text-foreground font-medium">{user.address.zipCode || 'Not provided'}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Address information not provided</p>
            )}
          </div>

          {/* Professional Information (Doctors) */}
          {user.role === 'doctor' && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Specialization</label>
                  <p className="text-foreground font-medium capitalize">
                    {user.professionalInfo?.specialization?.replace('-', ' ') || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">License Number</label>
                  <p className="text-foreground font-medium">{user.professionalInfo?.licenseNumber || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Experience</label>
                  <p className="text-foreground font-medium">
                    {user.professionalInfo?.experience 
                      ? `${user.professionalInfo.experience} years` 
                      : 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Consultation Fee</label>
                  <p className="text-foreground font-medium">
                    {user.professionalInfo?.consultationFee 
                      ? `$${user.professionalInfo.consultationFee}` 
                      : 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Qualifications</label>
                  <p className="text-foreground font-medium">
                    {user.professionalInfo?.qualifications?.length > 0 
                      ? user.professionalInfo.qualifications.join(', ') 
                      : 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Languages</label>
                  <p className="text-foreground font-medium">
                    {user.professionalInfo?.languages?.length > 0 
                      ? user.professionalInfo.languages.join(', ') 
                      : 'Not provided'}
                  </p>
                </div>
              </div>
              {user.professionalInfo?.biography && (
                <div className="mt-4">
                  <label className="text-sm text-muted-foreground">Biography</label>
                  <p className="text-foreground mt-1">{user.professionalInfo.biography}</p>
                </div>
              )}
            </div>
          )}

          {/* Emergency Contact (Patients) */}
          {user.role === 'patient' && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Emergency Contact</h3>
              {user.emergencyContact ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Name</label>
                    <p className="text-foreground font-medium">{user.emergencyContact.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Phone</label>
                    <p className="text-foreground font-medium">{user.emergencyContact.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Relationship</label>
                    <p className="text-foreground font-medium capitalize">{user.emergencyContact.relationship || 'Not provided'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Emergency contact information not provided</p>
              )}
            </div>
          )}

          {/* Medical Information (Patients) */}
          {user.role === 'patient' && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Medical Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Blood Group</label>
                  <p className="text-foreground font-medium">{user.medicalInfo?.bloodGroup || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Allergies</label>
                  <p className="text-foreground font-medium">
                    {user.medicalInfo?.allergies?.length > 0 
                      ? user.medicalInfo.allergies.join(', ') 
                      : 'None reported'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-muted-foreground">Current Medications</label>
                  <p className="text-foreground font-medium">
                    {user.medicalInfo?.medications?.length > 0 
                      ? user.medicalInfo.medications.join(', ') 
                      : 'None reported'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-muted-foreground">Medical Conditions</label>
                  <p className="text-foreground font-medium">
                    {user.medicalInfo?.medicalConditions?.length > 0 
                      ? user.medicalInfo.medicalConditions.join(', ') 
                      : 'None reported'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;