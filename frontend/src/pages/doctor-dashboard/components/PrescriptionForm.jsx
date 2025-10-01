import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const PrescriptionForm = ({ patient, onClose, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [medications, setMedications] = useState([
    {
      name: '',
      strength: '',
      dosage: '',
      frequency: '',
      durationValue: '',
      durationUnit: 'days',
      instructions: '',
      quantity: '',
      quantityUnit: 'tablets',
    },
  ]);
  const [notes, setNotes] = useState('');

  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = [...medications];
    updatedMedications[index] = {
      ...updatedMedications[index],
      [field]: value,
    };
    setMedications(updatedMedications);
  };

  const addMedication = () => {
    setMedications([
      ...medications,
      {
        name: '',
        strength: '',
        dosage: '',
        frequency: '',
        durationValue: '',
        durationUnit: 'days',
        instructions: '',
        quantity: '',
        quantityUnit: 'tablets',
      },
    ]);
  };

  const removeMedication = (index) => {
    if (medications.length > 1) {
      const updatedMedications = [...medications];
      updatedMedications.splice(index, 1);
      setMedications(updatedMedications);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const prescriptionData = {
        patient: patient.patientId,
        diagnosis,
        medications: medications.map(med => ({
          ...med,
          durationValue: parseInt(med.durationValue, 10),
          quantity: parseInt(med.quantity, 10),
        })),
        notes,
      };

      await onSubmit(prescriptionData);
      onClose();
    } catch (error) {
      console.error('Error creating prescription:', error);
      alert('Failed to create prescription. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-4xl w-full border border-border overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon name="FileText" size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Create Prescription</h3>
              <p className="text-sm text-muted-foreground">For patient: {patient.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={isSubmitting}
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[70vh]">
          <div className="p-6 space-y-6">
            {/* Diagnosis */}
            <div className="space-y-2">
              <label htmlFor="diagnosis" className="text-sm font-medium text-foreground block">
                Diagnosis
              </label>
              <Input
                id="diagnosis"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Enter diagnosis..."
                required
                className="w-full"
              />
            </div>

            {/* Medications */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Medications</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMedication}
                  className="flex items-center space-x-1"
                >
                  <Icon name="Plus" size={14} />
                  <span>Add Medication</span>
                </Button>
              </div>

              {medications.map((medication, index) => (
                <div
                  key={index}
                  className="border border-border rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium text-foreground">
                      Medication #{index + 1}
                    </h5>
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedication(index)}
                        className="text-destructive hover:text-destructive/80 transition-colors"
                      >
                        <Icon name="Trash" size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Medication Name
                      </label>
                      <Input
                        value={medication.name}
                        onChange={(e) =>
                          handleMedicationChange(index, 'name', e.target.value)
                        }
                        placeholder="Ex: Amoxicillin"
                        required
                      />
                    </div>

                    {/* Strength */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Strength
                      </label>
                      <Input
                        value={medication.strength}
                        onChange={(e) =>
                          handleMedicationChange(index, 'strength', e.target.value)
                        }
                        placeholder="Ex: 500mg"
                        required
                      />
                    </div>

                    {/* Dosage */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Dosage
                      </label>
                      <Input
                        value={medication.dosage}
                        onChange={(e) =>
                          handleMedicationChange(index, 'dosage', e.target.value)
                        }
                        placeholder="Ex: 1 tablet"
                        required
                      />
                    </div>

                    {/* Frequency */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Frequency
                      </label>
                      <Input
                        value={medication.frequency}
                        onChange={(e) =>
                          handleMedicationChange(index, 'frequency', e.target.value)
                        }
                        placeholder="Ex: 3 times a day"
                        required
                      />
                    </div>

                    {/* Duration */}
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Duration
                      </label>
                      <div className="flex space-x-2">
                        <Input
                          type="number"
                          value={medication.durationValue}
                          onChange={(e) =>
                            handleMedicationChange(index, 'durationValue', e.target.value)
                          }
                          placeholder="Duration"
                          min="1"
                          required
                          className="flex-1"
                        />
                        <select
                          value={medication.durationUnit}
                          onChange={(e) =>
                            handleMedicationChange(index, 'durationUnit', e.target.value)
                          }
                          className="px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground"
                        >
                          <option value="days">Days</option>
                          <option value="weeks">Weeks</option>
                          <option value="months">Months</option>
                        </select>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Quantity
                      </label>
                      <div className="flex space-x-2">
                        <Input
                          type="number"
                          value={medication.quantity}
                          onChange={(e) =>
                            handleMedicationChange(index, 'quantity', e.target.value)
                          }
                          placeholder="Amount"
                          min="1"
                          required
                          className="flex-1"
                        />
                        <select
                          value={medication.quantityUnit}
                          onChange={(e) =>
                            handleMedicationChange(index, 'quantityUnit', e.target.value)
                          }
                          className="px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground"
                        >
                          <option value="tablets">Tablets</option>
                          <option value="capsules">Capsules</option>
                          <option value="ml">ml</option>
                          <option value="bottles">Bottles</option>
                          <option value="packets">Packets</option>
                          <option value="strips">Strips</option>
                        </select>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Special Instructions
                      </label>
                      <textarea
                        value={medication.instructions}
                        onChange={(e) =>
                          handleMedicationChange(index, 'instructions', e.target.value)
                        }
                        placeholder="Special instructions for this medication..."
                        required
                        rows={3}
                        className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium text-foreground block">
                Additional Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes or instructions..."
                rows={4}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-3 flex items-start space-x-2">
              <Icon name="Info" size={16} className="text-primary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                This prescription will be digitally signed and can be accessed by the patient
                and pharmacies with the appropriate verification code.
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-border bg-muted/20">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center"
            >
              {isSubmitting ? (
                <>
                  <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Icon name="CheckCircle" size={16} className="mr-2" />
                  <span>Create Prescription</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrescriptionForm;