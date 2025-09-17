import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../AppIcon';
import Button from './Button';

const VerificationStatusBanner = ({ user, className = '' }) => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [showBanner, setShowBanner] = useState(true);
  const [lastChecked, setLastChecked] = useState(Date.now());

  // Listen for real-time verification updates
  useEffect(() => {
    console.log('🎧 Setting up verification update listener for user:', user?.email);
    
    const handleVerificationUpdate = async (event) => {
      const data = event.detail || event;
      console.log('🔔 Verification status update received in banner:', data);
      console.log('👤 Current user info:', { email: user?.email, id: user?.id, role: user?.role });
      
      // Check if this event is for the current user
      const isForCurrentUser = data.doctorEmail === user?.email || data.doctorId === user?.id;
      
      console.log('🔍 Event matching check:', {
        eventEmail: data.doctorEmail,
        eventId: data.doctorId,
        userEmail: user?.email,
        userId: user?.id,
        isMatch: isForCurrentUser
      });
      
      if (!isForCurrentUser) {
        console.log('📧 Event not for current user - ignoring');
        return;
      }
      
      console.log('✅ Event matches current user, processing verification update...');
      
      // Refresh user data when verification status changes
      if (refreshUser) {
        console.log('🔄 Refreshing user data...');
        const result = await refreshUser();
        console.log('✅ User data refreshed:', result);
      }
      
      // Show a notification
      if (data.status === 'approved') {
        // Remove any dismissal flag for approved status to show celebration
        localStorage.removeItem('hideVerificationSuccess');
        setShowBanner(true);
        
        // Show a success notification
        console.log('🎉 Doctor verification approved!');
      } else if (data.status === 'rejected') {
        // Make sure banner is shown for rejected status
        setShowBanner(true);
        console.log('❌ Doctor verification rejected');
      }
    };

    // Listen for custom events (from real-time notifications)
    window.addEventListener('verificationStatusUpdate', handleVerificationUpdate);
    
    // Listen for banner dismissal events
    const handleBannerDismissed = () => setShowBanner(false);
    window.addEventListener('verificationBannerDismissed', handleBannerDismissed);

    return () => {
      window.removeEventListener('verificationStatusUpdate', handleVerificationUpdate);
      window.removeEventListener('verificationBannerDismissed', handleBannerDismissed);
    };
  }, [refreshUser]);

  // Periodic status check for doctors who might be waiting for verification
  useEffect(() => {
    if (!user || user.role !== 'doctor' || !refreshUser) return;

    const shouldPeriodicCheck = ['pending', 'unverified'].includes(user.verificationStatus);
    
    if (shouldPeriodicCheck) {
      const interval = setInterval(async () => {
        console.log('🔄 Periodic verification status check...');
        await refreshUser();
        setLastChecked(Date.now());
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [user?.verificationStatus, refreshUser]);

  // Only show for doctors
  if (!user || user.role !== 'doctor') {
    return null;
  }

  // Get verification status from user data
  let verificationStatus = user.verificationStatus || 'unverified';
  
  // Check if professional info is complete
  const hasLicenseNumber = user.professionalInfo?.licenseNumber?.trim();
  const hasSpecialization = user.professionalInfo?.specialization?.trim();
  const isProfessionalInfoComplete = hasLicenseNumber && hasSpecialization;
  
  // If professional info is complete but status is still unverified, 
  // treat it as "processing" instead of showing "complete profile"
  if (verificationStatus === 'unverified' && isProfessionalInfoComplete) {
    verificationStatus = 'pending'; // Treat as pending since profile is complete
  }

  const statusConfig = {
    unverified: {
      bgColor: 'bg-gray-50 border-gray-200',
      textColor: 'text-gray-800',
      iconColor: 'text-gray-600',
      icon: 'AlertCircle',
      title: 'Complete Your Profile',
      message: 'Complete your professional information to get verified and appear in patient searches.',
      action: 'Complete Profile',
      actionVariant: 'default'
    },
    pending: {
      bgColor: 'bg-yellow-50 border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600',
      icon: 'Clock',
      title: 'Verification Pending',
      message: user.verificationDetails?.submittedAt 
        ? 'Your verification request is being reviewed by our admin team. This usually takes 1-2 business days.'
        : 'Your profile is complete! Your verification request has been submitted and is being processed.',
      action: 'View Status',
      actionVariant: 'outline'
    },
    approved: {
      bgColor: 'bg-green-50 border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600',
      icon: 'CheckCircle',
      title: 'Verified Doctor ✓',
      message: 'Congratulations! You are now verified and visible to patients for appointments.',
      action: null,
      actionVariant: null
    },
    rejected: {
      bgColor: 'bg-red-50 border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
      icon: 'XCircle',
      title: 'Verification Rejected',
      message: user.verificationDetails?.rejectionReason 
        ? `Rejection reason: ${user.verificationDetails.rejectionReason}. Please update your information and resubmit.`
        : 'Your verification was rejected. Please update your information and resubmit.',
      action: 'Update Profile',
      actionVariant: 'destructive'
    }
  };

  const config = statusConfig[verificationStatus];

  // Don't show banner for approved doctors after initial celebration
  if (verificationStatus === 'approved' && localStorage.getItem('hideVerificationSuccess') && showBanner) {
    return null;
  }
  
  if (!showBanner && verificationStatus === 'approved') {
    return null;
  }

  const handleAction = () => {
    if (verificationStatus === 'approved') {
      localStorage.setItem('hideVerificationSuccess', 'true');
      return;
    }
    navigate('/profile');
  };

  const handleDismiss = () => {
    if (verificationStatus === 'approved') {
      localStorage.setItem('hideVerificationSuccess', 'true');
      // Force re-render by dispatching a custom event
      window.dispatchEvent(new Event('verificationBannerDismissed'));
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${config.bgColor} ${className}`}>
      <div className="flex items-start space-x-4">
        <div className={`p-2 rounded-full bg-white/50 ${config.iconColor} flex-shrink-0`}>
          <Icon name={config.icon} size={20} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold ${config.textColor} mb-1`}>
            {config.title}
          </h3>
          <p className={`text-sm ${config.textColor} opacity-90`}>
            {config.message}
          </p>
          
          {/* Additional info for pending status */}
          {verificationStatus === 'pending' && user.verificationDetails?.submittedAt && (
            <p className={`text-xs ${config.textColor} opacity-75 mt-2`}>
              Submitted: {new Date(user.verificationDetails.submittedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
          
          {/* Additional info for rejected status */}
          {verificationStatus === 'rejected' && user.verificationDetails?.adminNotes && (
            <p className={`text-xs ${config.textColor} opacity-75 mt-2`}>
              Admin notes: {user.verificationDetails.adminNotes}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          {config.action && (
            <Button
              size="sm"
              variant={config.actionVariant}
              onClick={handleAction}
              className="whitespace-nowrap"
            >
              {config.action}
            </Button>
          )}
          
          {verificationStatus === 'approved' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className={`${config.textColor} hover:bg-white/50`}
            >
              <Icon name="X" size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationStatusBanner;