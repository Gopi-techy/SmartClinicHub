import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import { emitVerificationUpdate } from '../../utils/eventManager';

const DoctorVerification = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'approve' or 'reject'
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('unverified'); // 'unverified', 'pending', 'all'
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchDoctors();
    fetchVerificationStats();
  }, [activeTab, currentPage]);

  // Listen for new doctor registrations to auto-refresh
  useEffect(() => {
    const handleNewDoctorRegistration = (event) => {
      const data = event.detail || event;
      console.log('👨‍⚕️ New doctor registered:', data);
      
      // Auto-refresh the doctor list and stats
      fetchDoctors();
      fetchVerificationStats();
      
      console.log('🔄 Admin dashboard refreshed for new doctor registration');
    };

    // Listen for new doctor registration events
    window.addEventListener('newDoctorRegistration', handleNewDoctorRegistration);

    return () => {
      window.removeEventListener('newDoctorRegistration', handleNewDoctorRegistration);
    };
  }, []);

  // Periodic refresh as fallback (every 60 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Periodic admin dashboard refresh...');
      fetchDoctors();
      fetchVerificationStats();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      let endpoint = 'http://localhost:5000/api/admin/doctors/all-verification-statuses';
      let status = activeTab;
      

      
      // Map tab names to API status values
      if (activeTab === 'unverified') {
        status = 'unverified';
      } else if (activeTab === 'pending') {
        status = 'pending';
      } else if (activeTab === 'all') {
        status = 'all';
      }

      const url = `${endpoint}?status=${status}&page=${currentPage}&limit=20`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setDoctors(data.data.doctors || []);
        setPagination(data.data.pagination || null);
      } else {
        console.error('Failed to fetch doctors:', response.status, data.message);
        
        // If the endpoint fails, try to fallback to other endpoints
        if (activeTab === 'unverified') {
          const fallbackResponse = await fetch('http://localhost:5000/api/admin/doctors/unverified', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setDoctors(fallbackData.data.doctors || []);
            setPagination(fallbackData.data.pagination || null);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      // Set empty state on error
      setDoctors([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchVerificationStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/doctors/verification-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data.statistics);
      }
    } catch (error) {
      console.error('Error fetching verification stats:', error);
    }
  };

  const handleApprove = async (doctorId) => {
    setProcessingId(doctorId);
    
    // Find the doctor data for the event
    const doctorData = doctors.find(doc => doc._id === doctorId);
    
    try {
      const response = await fetch(`http://localhost:5000/api/admin/doctors/${doctorId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ adminNotes }),
      });

      if (response.ok) {
        setDoctors(prev => prev.filter(doc => doc._id !== doctorId));
        setShowModal(false);
        setAdminNotes('');
        fetchVerificationStats(); // Refresh stats
        fetchDoctors(); // Refresh current view
        
        // Trigger real-time verification update event
        console.log('📡 Triggering verification update event for:', doctorData.email);
        emitVerificationUpdate(
          doctorData, 
          'approved', 
          'Your verification has been approved!'
        );
        
        console.log('✅ Doctor approved and real-time event triggered for:', doctorData.email);
      } else {
        console.error('Failed to approve doctor');
      }
    } catch (error) {
      console.error('Error approving doctor:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (doctorId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setProcessingId(doctorId);
    
    // Find the doctor data for the event
    const doctorData = doctors.find(doc => doc._id === doctorId);
    
    try {
      const response = await fetch(`http://localhost:5000/api/admin/doctors/${doctorId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ rejectionReason, adminNotes }),
      });

      if (response.ok) {
        setDoctors(prev => prev.filter(doc => doc._id !== doctorId));
        setShowModal(false);
        setRejectionReason('');
        setAdminNotes('');
        fetchVerificationStats(); // Refresh stats
        fetchDoctors(); // Refresh current view
        
        // Trigger real-time verification update event
        console.log('📡 Triggering rejection event for:', doctorData.email);
        emitVerificationUpdate(
          doctorData, 
          'rejected', 
          `Your verification was rejected: ${rejectionReason}`,
          rejectionReason
        );
        
        console.log('❌ Doctor rejected and real-time event triggered for:', doctorData.email);
      } else {
        console.error('Failed to reject doctor');
      }
    } catch (error) {
      console.error('Error rejecting doctor:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const openModal = (doctor, type) => {
    setSelectedDoctor(doctor);
    setModalType(type);
    setShowModal(true);
    setAdminNotes('');
    setRejectionReason('');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading pending verifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Doctor Verification</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve doctor registrations to prevent fraud
          </p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat._id === 'pending' && 'Pending Review'}
                      {stat._id === 'approved' && 'Approved'}
                      {stat._id === 'rejected' && 'Rejected'}
                      {stat._id === 'unverified' && 'Unverified'}
                    </p>
                    <p className="text-2xl font-bold text-foreground">{stat.count}</p>
                    {stat.avgProcessingTime && (
                      <p className="text-xs text-muted-foreground">
                        Avg: {Math.round(stat.avgProcessingTime)} days
                      </p>
                    )}
                  </div>
                  <div className={`p-3 rounded-full ${
                    stat._id === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                    stat._id === 'approved' ? 'bg-green-100 text-green-600' :
                    stat._id === 'rejected' ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon 
                      name={
                        stat._id === 'pending' ? 'Clock' :
                        stat._id === 'approved' ? 'CheckCircle' :
                        stat._id === 'rejected' ? 'XCircle' :
                        'AlertCircle'
                      } 
                      size={20} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-card rounded-lg border border-border overflow-hidden mb-6">
          <div className="border-b border-border">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { key: 'unverified', label: 'Unverified', description: 'Doctors who haven\'t completed profile' },
                { key: 'pending', label: 'Pending Review', description: 'Awaiting admin approval' },
                { key: 'all', label: 'All Statuses', description: 'All doctors regardless of status' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setCurrentPage(1);
                  }}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content Description */}
          <div className="px-6 py-3 bg-muted/30">
            <p className="text-sm text-muted-foreground">
              {activeTab === 'unverified' && 'Doctors who have registered but not completed their professional information or license verification.'}
              {activeTab === 'pending' && 'Doctors who have completed their profile and are awaiting admin review for verification.'}
              {activeTab === 'all' && 'All doctors in the system with any verification status (unverified, pending, approved, rejected).'}
            </p>
          </div>
        </div>

        {/* Doctors List */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                {activeTab === 'unverified' && `Unverified Doctors (${pagination?.totalItems || 0})`}
                {activeTab === 'pending' && `Pending Verifications (${pagination?.totalItems || 0})`}
                {activeTab === 'all' && `All Doctors (${pagination?.totalItems || 0})`}
              </h2>
              
              {/* Pagination Info */}
              {pagination && pagination.totalItems > 0 && (
                <div className="text-sm text-muted-foreground">
                  Showing {((pagination.currentPage - 1) * 20) + 1} to {Math.min(pagination.currentPage * 20, pagination.totalItems)} of {pagination.totalItems}
                </div>
              )}
            </div>
          </div>

          {doctors.length === 0 ? (
            <div className="p-12 text-center">
              <Icon name={activeTab === 'unverified' ? 'AlertCircle' : 'CheckCircle'} size={48} className={`mx-auto mb-4 ${activeTab === 'unverified' ? 'text-yellow-500' : 'text-green-500'}`} />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {activeTab === 'unverified' && 'No Unverified Doctors'}
                {activeTab === 'pending' && 'All Caught Up!'}
                {activeTab === 'all' && 'No Doctors Found'}
              </h3>
              <p className="text-muted-foreground">
                {activeTab === 'unverified' && 'All doctors have completed their profile information.'}
                {activeTab === 'pending' && 'No pending doctor verifications at the moment.'}
                {activeTab === 'all' && 'No doctors match the current filters.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {doctors.map((doctor) => (
                <div key={doctor._id} className="p-6 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Icon name="Stethoscope" className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-foreground">
                              Dr. {doctor.firstName} {doctor.lastName}
                            </h3>
                            {/* Verification Status Badge */}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              doctor.verificationStatus === 'unverified' ? 'bg-gray-100 text-gray-800' :
                              doctor.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              doctor.verificationStatus === 'approved' ? 'bg-green-100 text-green-800' :
                              doctor.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {doctor.verificationStatus === 'unverified' && '⚪ Unverified'}
                              {doctor.verificationStatus === 'pending' && '🟡 Pending'}
                              {doctor.verificationStatus === 'approved' && '✅ Approved'}
                              {doctor.verificationStatus === 'rejected' && '❌ Rejected'}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{doctor.email}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>Registered: {formatDate(doctor.createdAt)}</span>
                            {doctor.verificationDetails?.submittedAt && (
                              <span>Submitted: {formatDate(doctor.verificationDetails.submittedAt)}</span>
                            )}
                            {doctor.verificationDetails?.reviewedAt && (
                              <span>Reviewed: {formatDate(doctor.verificationDetails.reviewedAt)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Professional Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">Specialization</p>
                          <p className="text-muted-foreground">
                            {doctor.professionalInfo?.specialization || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">License Number</p>
                          <p className="text-muted-foreground font-mono">
                            {doctor.professionalInfo?.licenseNumber || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Experience</p>
                          <p className="text-muted-foreground">
                            {doctor.professionalInfo?.experience 
                              ? `${doctor.professionalInfo.experience} years`
                              : 'Not specified'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Phone</p>
                          <p className="text-muted-foreground">
                            {doctor.phone || 'Not provided'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Profile Completion Status */}
                      <div className="mb-4">
                        <p className="text-sm font-medium text-foreground mb-2">Profile Status</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            (doctor.professionalInfo?.specialization && doctor.professionalInfo?.licenseNumber) 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            Professional Info: {(doctor.professionalInfo?.specialization && doctor.professionalInfo?.licenseNumber) ? 'Complete' : 'Incomplete'}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            (doctor.firstName && doctor.lastName && doctor.email && doctor.phone) 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            Basic Info: {(doctor.firstName && doctor.lastName && doctor.email && doctor.phone) ? 'Complete' : 'Incomplete'}
                          </span>
                        </div>
                      </div>

                      {/* Qualifications */}
                      {doctor.professionalInfo?.qualifications?.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-foreground mb-2">Qualifications</p>
                          <div className="flex flex-wrap gap-2">
                            {doctor.professionalInfo.qualifications.map((qual, index) => (
                              <span 
                                key={index}
                                className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                              >
                                {qual}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 ml-6">
                      {doctor.verificationStatus === 'unverified' && (
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-2">Profile Incomplete</p>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="text-gray-400 border-gray-300"
                          >
                            <Icon name="Clock" size={16} className="mr-2" />
                            Awaiting Profile
                          </Button>
                        </div>
                      )}
                      
                      {doctor.verificationStatus === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openModal(doctor, 'approve')}
                            disabled={processingId === doctor._id}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <Icon name="Check" size={16} className="mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openModal(doctor, 'reject')}
                            disabled={processingId === doctor._id}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <Icon name="X" size={16} className="mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                      
                      {doctor.verificationStatus === 'approved' && (
                        <div className="text-center">
                          <p className="text-sm text-green-600 mb-2">✅ Verified</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openModal(doctor, 'reject')}
                            disabled={processingId === doctor._id}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <Icon name="X" size={16} className="mr-2" />
                            Revoke
                          </Button>
                        </div>
                      )}
                      
                      {doctor.verificationStatus === 'rejected' && (
                        <div className="text-center">
                          <p className="text-sm text-red-600 mb-2">❌ Rejected</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openModal(doctor, 'approve')}
                            disabled={processingId === doctor._id}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <Icon name="Check" size={16} className="mr-2" />
                            Re-approve
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={!pagination.hasPrevPage || loading}
                  >
                    <Icon name="ChevronLeft" size={16} className="mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!pagination.hasNextPage || loading}
                  >
                    Next
                    <Icon name="ChevronRight" size={16} className="ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {modalType === 'approve' && selectedDoctor.verificationStatus === 'rejected' ? 'Re-approve Doctor' : 
               modalType === 'approve' ? 'Approve Doctor' : 
               selectedDoctor.verificationStatus === 'approved' ? 'Revoke Doctor Verification' : 'Reject Doctor'}
            </h3>
            
            <div className="mb-4">
              <p className="text-muted-foreground">
                Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                License: {selectedDoctor.professionalInfo?.licenseNumber || 'Not provided'}
              </p>
              <p className="text-sm text-muted-foreground">
                Current Status: <span className={`font-medium ${
                  selectedDoctor.verificationStatus === 'pending' ? 'text-yellow-600' :
                  selectedDoctor.verificationStatus === 'approved' ? 'text-green-600' :
                  selectedDoctor.verificationStatus === 'rejected' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {selectedDoctor.verificationStatus}
                </span>
              </p>
              {selectedDoctor.verificationDetails?.rejectionReason && (
                <p className="text-sm text-red-600 mt-2">
                  Previous rejection: {selectedDoctor.verificationDetails.rejectionReason}
                </p>
              )}
            </div>

            {modalType === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Rejection Reason *
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 border border-border rounded-md bg-background text-foreground"
                  required
                >
                  <option value="">Select a reason...</option>
                  <option value="invalid_license">Invalid License Number</option>
                  <option value="incomplete_info">Incomplete Information</option>
                  <option value="suspicious_credentials">Suspicious Credentials</option>
                  <option value="verification_failed">Verification Failed</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Admin Notes (Optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full p-3 border border-border rounded-md bg-background text-foreground"
                rows={3}
                placeholder="Add any additional notes..."
              />
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={processingId === selectedDoctor._id}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (modalType === 'approve') {
                    handleApprove(selectedDoctor._id);
                  } else {
                    handleReject(selectedDoctor._id);
                  }
                }}
                disabled={processingId === selectedDoctor._id}
                className={`flex-1 ${
                  modalType === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processingId === selectedDoctor._id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Icon 
                    name={modalType === 'approve' ? 'Check' : 'X'} 
                    size={16} 
                    className="mr-2" 
                  />
                )}
                {modalType === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorVerification;