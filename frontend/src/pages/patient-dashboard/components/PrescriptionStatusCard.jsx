import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PrescriptionsList from './PrescriptionsList';

const PrescriptionStatusCard = ({ prescriptions = [] }) => {
  // Ensure prescriptions is always an array
  const safePrescriptions = Array.isArray(prescriptions) ? prescriptions : [];
  const [showAllPrescriptions, setShowAllPrescriptions] = useState(false);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success';
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'expired':
        return 'bg-destructive/10 text-destructive';
      case 'refill_needed':
        return 'bg-accent/10 text-accent';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return 'CheckCircle';
      case 'pending':
        return 'Clock';
      case 'expired':
        return 'XCircle';
      case 'refill_needed':
        return 'RefreshCw';
      default:
        return 'Pill';
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border shadow-healthcare">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Icon name="Pill" size={24} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Prescriptions</h3>
            <p className="text-sm text-muted-foreground">
              {safePrescriptions.length === 0 ? 'No medications' : `${safePrescriptions.length} active medications`}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" iconName="Plus">
          Add
        </Button>
      </div>

      {safePrescriptions.length === 0 ? (
        <div className="text-center py-8">
          <Icon name="Pill" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h4 className="text-lg font-medium text-foreground mb-2">No Prescriptions</h4>
          <p className="text-muted-foreground mb-4">Complete your profile to manage prescriptions and medications</p>
          <Button variant="outline" iconName="Plus" iconPosition="left">
            Add Medication
          </Button>
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          {safePrescriptions.map((prescription, index) => (
          <div key={index} className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-foreground">{prescription.medication}</h4>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(prescription.status)}`}>
                    <Icon name={getStatusIcon(prescription.status)} size={12} className="mr-1" />
                    {prescription.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{prescription.dosage} • {prescription.frequency}</p>
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span>Prescribed: {prescription.prescribedDate}</span>
                  <span>Refills: {prescription.refillsLeft}</span>
                </div>
              </div>
            </div>

            {prescription.status === 'refill_needed' && (
              <div className="flex items-center justify-between bg-accent/5 rounded-lg p-3 mt-3">
                <div className="flex items-center space-x-2">
                  <Icon name="AlertCircle" size={16} className="text-accent" />
                  <span className="text-sm font-medium text-accent">Refill needed soon</span>
                </div>
                <Button variant="outline" size="xs" className="text-accent border-accent hover:bg-accent hover:text-accent-foreground">
                  Request Refill
                </Button>
              </div>
            )}

            {prescription.nextDose && (
              <div className="flex items-center space-x-2 mt-3 text-sm text-muted-foreground">
                <Icon name="Clock" size={14} />
                <span>Next dose: {prescription.nextDose}</span>
              </div>
            )}
            </div>
          ))}
        </div>
      )}

      {prescriptions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            size="sm"
            iconName="FileText"
            iconPosition="left"
            className="flex-1"
            onClick={() => setShowAllPrescriptions(true)}
          >
            View All
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="RefreshCw"
            iconPosition="left"
            className="flex-1"
          >
            Request Refill
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="Download"
            iconPosition="left"
            className="flex-1"
          >
            Download List
          </Button>
        </div>
      )}

      {/* Prescription List Modal */}
      {showAllPrescriptions && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-4xl w-full border border-border overflow-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">All Prescriptions</h3>
              <button
                onClick={() => setShowAllPrescriptions(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="X" size={20} />
              </button>
            </div>
            <div className="p-4">
              <PrescriptionsList />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionStatusCard;