import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const PatientManagementTable = ({ patients, onPatientSelect, onCreatePrescription, onCancelAppointment }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'appointmentTime', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedPatients = useMemo(() => {
    let filtered = patients.filter(patient => {
      const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           patient.reason.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      if (sortConfig.key) {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
      }
      return 0;
    });
  }, [patients, sortConfig, searchQuery, statusFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting':
        return 'bg-warning text-warning-foreground';
      case 'in-progress':
        return 'bg-primary text-primary-foreground';
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'cancelled':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return { icon: 'AlertTriangle', color: 'text-error' };
      case 'medium':
        return { icon: 'Clock', color: 'text-warning' };
      case 'low':
        return { icon: 'Minus', color: 'text-muted-foreground' };
      default:
        return { icon: 'Minus', color: 'text-muted-foreground' };
    }
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return 'ArrowUpDown';
    }
    return sortConfig.direction === 'asc' ? 'ArrowUp' : 'ArrowDown';
  };

  const handleViewDetails = (patient, e) => {
    e.stopPropagation();
    setSelectedAppointment(patient);
    setShowDetailsModal(true);
  };

  const handleCancelClick = (patient, e) => {
    e.stopPropagation();
    setAppointmentToCancel(patient);
    setShowCancelModal(true);
  };

  const confirmCancelAppointment = async () => {
    if (!appointmentToCancel) {
      console.log('No appointment to cancel');
      return;
    }
    
    console.log('Cancelling appointment:', appointmentToCancel);
    setIsCancelling(true);
    try {
      const appointmentId = appointmentToCancel.appointmentId || appointmentToCancel._id || appointmentToCancel.id;
      console.log('Using appointment ID:', appointmentId);
      
      if (onCancelAppointment) {
        await onCancelAppointment(appointmentId, cancelReason);
        console.log('Appointment cancelled successfully');
      } else {
        console.error('onCancelAppointment handler not provided');
      }
      setShowCancelModal(false);
      setAppointmentToCancel(null);
      setCancelReason('');
    } catch (error) {
      console.error('Cancel appointment error:', error);
      alert(error.message || 'Failed to cancel appointment');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
              <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Patient Management</h2>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Appointment Based
                </span>
              </div>
            </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search patients by name or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'waiting', 'in-progress', 'completed'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status === 'all' ? 'All' : status.replace('-', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-1 font-medium text-foreground hover:text-primary transition-healthcare"
                >
                  <span>Patient Name</span>
                  <Icon name={getSortIcon('name')} size={14} />
                </button>
              </th>
              <th className="text-left py-3 px-2">
                <button
                  onClick={() => handleSort('appointmentTime')}
                  className="flex items-center space-x-1 font-medium text-foreground hover:text-primary transition-healthcare"
                >
                  <span>Time</span>
                  <Icon name={getSortIcon('appointmentTime')} size={14} />
                </button>
              </th>
              <th className="text-left py-3 px-2">
                <button
                  onClick={() => handleSort('reason')}
                  className="flex items-center space-x-1 font-medium text-foreground hover:text-primary transition-healthcare"
                >
                  <span>Visit Reason</span>
                  <Icon name={getSortIcon('reason')} size={14} />
                </button>
              </th>
              <th className="text-left py-3 px-2">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center space-x-1 font-medium text-foreground hover:text-primary transition-healthcare"
                >
                  <span>Status</span>
                  <Icon name={getSortIcon('status')} size={14} />
                </button>
              </th>
              <th className="text-left py-3 px-2">Priority</th>
              <th className="text-right py-3 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedPatients.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8">
                  <Icon name="Search" size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No patients found matching your criteria</p>
                </td>
              </tr>
            ) : (
              filteredAndSortedPatients.map((patient) => {
                const priority = getPriorityIcon(patient.priority);
                return (
                  <tr
                    key={patient.id}
                    className="border-b border-border hover:bg-muted/50 transition-healthcare cursor-pointer"
                    onClick={() => onPatientSelect(patient)}
                  >
                    <td className="py-4 px-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Icon name="User" size={16} className="text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{patient.name}</div>
                          <div className="text-sm text-muted-foreground">ID: {patient.patientId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div className="text-sm">
                        <div className="font-medium text-foreground">{patient.appointmentTime}</div>
                        <div className="text-muted-foreground">{patient.duration} min</div>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div className="text-sm text-foreground">{patient.reason}</div>
                    </td>
                    <td className="py-4 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                        {patient.status.charAt(0).toUpperCase() + patient.status.slice(1).replace('-', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-2">
                      <Icon name={priority.icon} size={16} className={priority.color} />
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => handleViewDetails(patient, e)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-primary hover:text-primary hover:bg-primary/10 transition-colors"
                          title="View Details"
                        >
                          <Icon name="Info" size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreatePrescription && onCreatePrescription(patient);
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-success hover:text-success hover:bg-success/10 transition-colors"
                          title="Create Prescription"
                        >
                          <Icon name="FileText" size={16} />
                        </button>
                        <button
                          onClick={(e) => handleCancelClick(patient, e)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Cancel Appointment"
                        >
                          <Icon name="Trash" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Appointment Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full border border-border">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon name="Calendar" size={20} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Appointment Details</h3>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="X" size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Patient Information */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">Patient Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Icon name="User" size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Patient Name</p>
                      <p className="text-sm font-medium text-foreground">{selectedAppointment.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon name="Hash" size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Patient ID</p>
                      <p className="text-sm font-medium text-foreground">{selectedAppointment.patientId}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Appointment Information */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">Appointment Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Icon name="Clock" size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="text-sm font-medium text-foreground">{selectedAppointment.appointmentTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon name="Timer" size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="text-sm font-medium text-foreground">{selectedAppointment.duration} minutes</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon name="Calendar" size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="text-sm font-medium text-foreground">
                        {selectedAppointment.appointmentDate ? formatDate(selectedAppointment.appointmentDate) : 'Today'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon name="Activity" size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAppointment.status)}`}>
                        {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1).replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visit Reason */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">Visit Reason</h4>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-foreground">{selectedAppointment.reason}</p>
                </div>
              </div>

              {/* Appointment ID */}
              {(selectedAppointment.appointmentId || selectedAppointment._id) && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Appointment ID</span>
                    <span className="font-mono text-sm font-medium text-foreground">
                      {selectedAppointment.appointmentId || selectedAppointment._id}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-border bg-muted/20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </Button>
              <Button
                variant="default"
                size="sm"
                iconName="FileText"
                iconPosition="left"
                onClick={() => {
                  setShowDetailsModal(false);
                  onPatientSelect(selectedAppointment);
                }}
              >
                View Patient Notes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Appointment Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-md w-full border border-border">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                  <Icon name="AlertTriangle" size={20} className="text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Cancel Appointment</h3>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                disabled={isCancelling}
              >
                <Icon name="X" size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to cancel the appointment with <strong>{appointmentToCancel?.name}</strong>? This action cannot be undone.
              </p>

              <div className="space-y-2">
                <label htmlFor="cancelReason" className="text-sm font-medium text-foreground">
                  Reason for cancellation (optional)
                </label>
                <textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason for cancelling..."
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={3}
                  disabled={isCancelling}
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-3 flex items-start space-x-2">
                <Icon name="Info" size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  The patient will be notified about the cancellation.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-border bg-muted/20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
              >
                Keep Appointment
              </Button>
              <button
                type="button"
                onClick={confirmCancelAppointment}
                disabled={isCancelling}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCancelling ? (
                  <>
                    <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <>
                    <Icon name="Trash" size={16} className="mr-2" />
                    <span>Cancel Appointment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientManagementTable;