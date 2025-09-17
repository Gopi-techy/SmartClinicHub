import React, { useState, useEffect } from 'react';
import ToastNotification from './ToastNotification';

const ToastManager = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Listen for verification status updates to show notifications
    const handleVerificationUpdate = (event) => {
      const data = event.detail;
      
      if (data.status === 'approved') {
        showToast('success', '🎉 Congratulations! Your verification has been approved. You are now visible to patients for appointments.');
      } else if (data.status === 'rejected') {
        showToast('error', `❌ Your verification was rejected: ${data.message || 'Please update your information and resubmit.'}`);
      }
    };

    window.addEventListener('verificationStatusUpdate', handleVerificationUpdate);

    return () => {
      window.removeEventListener('verificationStatusUpdate', handleVerificationUpdate);
    };
  }, []);

  const showToast = (type, message, duration = 5000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, type, message, duration };
    
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <div className="toast-container">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ top: `${4 + index * 80}px` }}
          className="absolute"
        >
          <ToastNotification
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastManager;