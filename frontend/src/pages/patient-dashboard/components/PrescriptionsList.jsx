import React, { useState, useEffect } from 'react';
import prescriptionService from '../../../services/prescriptionService';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PrescriptionsList = ({ patientId }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      if (!patientId) return;
      
      try {
        setLoading(true);
        const response = await prescriptionService.getPatientPrescriptions(patientId);
        if (response.success) {
          setPrescriptions(response.prescriptions);
        } else {
          setError(response.message || 'Failed to fetch prescriptions');
        }
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
        setError(error.message || 'An error occurred while fetching prescriptions');
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [patientId]);

  const handleViewDetails = (prescription) => {
    setSelectedPrescription(prescription);
    setShowDetailsModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">My Prescriptions</h2>
        </div>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">My Prescriptions</h2>
        </div>
        <div className="flex justify-center items-center py-8 text-center">
          <div>
            <Icon name="AlertCircle" size={32} className="mx-auto text-destructive mb-2" />
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">My Prescriptions</h2>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Active Medications
          </span>
        </div>
      </div>

      {prescriptions.length === 0 ? (
        <div className="text-center py-8">
          <Icon name="FileText" size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No prescriptions found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Your doctor hasn't issued any prescriptions yet
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-medium text-foreground">Date</th>
                <th className="text-left py-3 px-2 font-medium text-foreground">Doctor</th>
                <th className="text-left py-3 px-2 font-medium text-foreground">Diagnosis</th>
                <th className="text-left py-3 px-2 font-medium text-foreground">Status</th>
                <th className="text-right py-3 px-2 font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((prescription) => (
                <tr 
                  key={prescription._id}
                  className="border-b border-border hover:bg-muted/50 transition-healthcare cursor-pointer"
                  onClick={() => handleViewDetails(prescription)}
                >
                  <td className="py-4 px-2">
                    <div className="text-sm font-medium text-foreground">
                      {formatDate(prescription.createdAt)}
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Icon name="UserCheck" size={16} className="text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">Dr. {prescription.doctor?.firstName} {prescription.doctor?.lastName}</div>
                        <div className="text-xs text-muted-foreground">{prescription.doctor?.professionalInfo?.specialization || 'Specialist'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="text-sm text-foreground">{prescription.diagnosis}</div>
                  </td>
                  <td className="py-4 px-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      prescription.status === 'active' ? 'bg-success text-success-foreground' :
                      prescription.status === 'expired' ? 'bg-warning text-warning-foreground' :
                      prescription.status === 'cancelled' ? 'bg-destructive text-destructive-foreground' :
                      'bg-secondary text-secondary-foreground'
                    }`}>
                      {prescription.status?.charAt(0).toUpperCase() + prescription.status?.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(prescription);
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-primary hover:text-primary hover:bg-primary/10 transition-colors"
                        title="View Prescription Details"
                      >
                        <Icon name="Eye" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Prescription Details Modal */}
      {showDetailsModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-3xl w-full border border-border">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon name="FileText" size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Prescription Details</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(selectedPrescription.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="X" size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Prescription Information */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-muted-foreground">Prescription Information</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedPrescription.status === 'active' ? 'bg-success text-success-foreground' :
                    selectedPrescription.status === 'expired' ? 'bg-warning text-warning-foreground' :
                    selectedPrescription.status === 'cancelled' ? 'bg-destructive text-destructive-foreground' :
                    'bg-secondary text-secondary-foreground'
                  }`}>
                    {selectedPrescription.status?.charAt(0).toUpperCase() + selectedPrescription.status?.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Icon name="UserCheck" size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Prescribing Doctor</p>
                      <p className="text-sm font-medium text-foreground">
                        Dr. {selectedPrescription.doctor?.firstName} {selectedPrescription.doctor?.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon name="Calendar" size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Date Issued</p>
                      <p className="text-sm font-medium text-foreground">
                        {formatDate(selectedPrescription.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Diagnosis */}
                <div className="pt-3">
                  <h5 className="text-sm font-semibold text-foreground mb-2">Diagnosis</h5>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-foreground">{selectedPrescription.diagnosis}</p>
                  </div>
                </div>
              </div>

              {/* Medications List */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Medications</h4>
                {selectedPrescription.medications?.map((medication, index) => (
                  <div 
                    key={index}
                    className="bg-muted/30 border border-border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <h5 className="text-sm font-semibold text-foreground">
                        {medication.name} ({medication.strength})
                      </h5>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-start space-x-2">
                        <Icon name="Clock" size={14} className="text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Dosage & Frequency</p>
                          <p className="text-sm text-foreground">
                            {medication.dosage}, {medication.frequency}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Icon name="Calendar" size={14} className="text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Duration</p>
                          <p className="text-sm text-foreground">
                            {medication.durationValue} {medication.durationUnit}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Icon name="Package" size={14} className="text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Quantity</p>
                          <p className="text-sm text-foreground">
                            {medication.quantity} {medication.quantityUnit}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Icon name="AlertCircle" size={14} className="text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Refills</p>
                          <p className="text-sm text-foreground">
                            {medication.refills || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    {medication.instructions && (
                      <div className="pt-2 border-t border-border mt-2">
                        <p className="text-xs text-muted-foreground mb-1">Special Instructions</p>
                        <p className="text-sm text-foreground">{medication.instructions}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Additional Notes */}
              {selectedPrescription.notes && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Additional Notes</h4>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm text-foreground">{selectedPrescription.notes}</p>
                  </div>
                </div>
              )}

              {/* Verification Code */}
              {selectedPrescription.verificationCode && (
                <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground">Verification Code</h4>
                    <p className="text-sm text-foreground">
                      {selectedPrescription.verificationCode}
                    </p>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      iconName="Printer"
                      onClick={() => window.print()}
                    >
                      Print Prescription
                    </Button>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionsList;