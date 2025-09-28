import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const DrugInteractionChecker = ({ onBack }) => {
  const [medications, setMedications] = useState([]);
  const [currentMed, setCurrentMed] = useState({
    name: '',
    dosage: '',
    frequency: ''
  });
  const [patientInfo, setPatientInfo] = useState({
    age: '',
    conditions: [],
    allergies: []
  });
  const [interactions, setInteractions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newCondition, setNewCondition] = useState('');
  const [newAllergy, setNewAllergy] = useState('');

  const addMedication = () => {
    if (currentMed.name.trim()) {
      const newMedication = {
        id: Date.now(),
        name: currentMed.name.trim(),
        dosage: currentMed.dosage.trim(),
        frequency: currentMed.frequency.trim()
      };
      setMedications([...medications, newMedication]);
      setCurrentMed({ name: '', dosage: '', frequency: '' });
    }
  };

  const removeMedication = (id) => {
    setMedications(medications.filter(m => m.id !== id));
  };

  const addCondition = () => {
    if (newCondition.trim()) {
      setPatientInfo({
        ...patientInfo,
        conditions: [...patientInfo.conditions, newCondition.trim()]
      });
      setNewCondition('');
    }
  };

  const removeCondition = (index) => {
    setPatientInfo({
      ...patientInfo,
      conditions: patientInfo.conditions.filter((_, i) => i !== index)
    });
  };

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setPatientInfo({
        ...patientInfo,
        allergies: [...patientInfo.allergies, newAllergy.trim()]
      });
      setNewAllergy('');
    }
  };

  const removeAllergy = (index) => {
    setPatientInfo({
      ...patientInfo,
      allergies: patientInfo.allergies.filter((_, i) => i !== index)
    });
  };

  const checkInteractions = async () => {
    if (medications.length < 2) {
      alert('Please add at least 2 medications to check for interactions.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('http://localhost:5000/api/ai/drug-interactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medications,
          patientInfo
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to check drug interactions');
      }

      const result = await response.json();
      setInteractions(result.data);
    } catch (error) {
      console.error('Error checking interactions:', error);
      alert('Failed to check drug interactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'minor': return 'text-green-600 bg-green-100 border-green-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'major': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'contraindicated': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  if (interactions) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" iconName="ArrowLeft" onClick={onBack}>
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Drug Interaction Analysis</h1>
            <p className="text-muted-foreground">AI-powered analysis of your medication interactions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overall Risk */}
            <div className={`p-6 rounded-lg border-2 ${getRiskColor(interactions.overallRisk)}`}>
              <div className="flex items-center space-x-3">
                <Icon name="Shield" size={24} />
                <div>
                  <h3 className="text-lg font-semibold">Overall Risk Level</h3>
                  <p className="text-sm opacity-90 capitalize">{interactions.overallRisk} Risk Detected</p>
                </div>
              </div>
            </div>

            {/* Critical Alerts */}
            {interactions.criticalAlerts?.length > 0 && (
              <div className="bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800 p-6">
                <h3 className="font-semibold text-red-800 dark:text-red-200 mb-4 flex items-center">
                  <Icon name="AlertTriangle" size={20} className="mr-2" />
                  Critical Alerts
                </h3>
                <div className="space-y-2">
                  {interactions.criticalAlerts.map((alert, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Icon name="AlertCircle" size={16} className="text-red-600 mt-0.5" />
                      <span className="text-sm text-red-800 dark:text-red-200">{alert}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drug-Drug Interactions */}
            {interactions.interactions?.drugDrugInteractions?.length > 0 && (
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center">
                  <Icon name="Pill" size={20} className="mr-2 text-orange-600" />
                  Drug-Drug Interactions
                </h3>
                <div className="space-y-4">
                  {interactions.interactions.drugDrugInteractions.map((interaction, index) => (
                    <div key={index} className={`border rounded-lg p-4 ${getSeverityColor(interaction.severity)}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {interaction.drug1} ↔ {interaction.drug2}
                          </h4>
                          <div className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 capitalize ${getSeverityColor(interaction.severity)}`}>
                            {interaction.severity} Interaction
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>Mechanism:</strong> {interaction.mechanism}
                        </div>
                        <div>
                          <strong>Effect:</strong> {interaction.effect}
                        </div>
                        <div>
                          <strong>Management:</strong> {interaction.management}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drug-Condition Interactions */}
            {interactions.interactions?.drugConditionInteractions?.length > 0 && (
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center">
                  <Icon name="Heart" size={20} className="mr-2 text-blue-600" />
                  Drug-Condition Interactions
                </h3>
                <div className="space-y-3">
                  {interactions.interactions.drugConditionInteractions.map((interaction, index) => (
                    <div key={index} className="border border-border rounded p-3">
                      <div className="font-medium text-foreground mb-1">
                        {interaction.drug} & {interaction.condition}
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        <strong>Concern:</strong> {interaction.concern}
                      </div>
                      <div className="text-sm text-foreground">
                        <strong>Recommendation:</strong> {interaction.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monitoring Requirements */}
            {interactions.interactions?.monitoringRequired?.length > 0 && (
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center">
                  <Icon name="Eye" size={20} className="mr-2 text-purple-600" />
                  Monitoring Requirements
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {interactions.interactions.monitoringRequired.map((requirement, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded">
                      <Icon name="CheckCircle" size={16} className="text-purple-600" />
                      <span className="text-sm text-foreground">{requirement}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recommendations */}
            {interactions.recommendations?.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
                  <Icon name="Lightbulb" size={20} className="mr-2" />
                  Recommendations
                </h3>
                <div className="space-y-2">
                  {interactions.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Icon name="ArrowRight" size={14} className="text-blue-600 mt-0.5" />
                      <span className="text-sm text-blue-800 dark:text-blue-200">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Age Considerations */}
            {interactions.interactions?.ageConsiderations && (
              <div className="bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800 p-6">
                <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-3 flex items-center">
                  <Icon name="Clock" size={20} className="mr-2" />
                  Age Considerations
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {interactions.interactions.ageConsiderations}
                </p>
              </div>
            )}

            {/* Dosage Adjustments */}
            {interactions.interactions?.dosageAdjustments?.length > 0 && (
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="font-semibold text-foreground mb-3 flex items-center">
                  <Icon name="Settings" size={20} className="mr-2 text-green-600" />
                  Dosage Adjustments
                </h3>
                <div className="space-y-2">
                  {interactions.interactions.dosageAdjustments.map((adjustment, index) => (
                    <div key={index} className="text-sm text-foreground p-2 bg-muted rounded">
                      {adjustment}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Allergy Conflicts */}
            {interactions.interactions?.allergyConflicts?.length > 0 && (
              <div className="bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800 p-6">
                <h3 className="font-semibold text-red-800 dark:text-red-200 mb-3 flex items-center">
                  <Icon name="AlertTriangle" size={20} className="mr-2" />
                  Allergy Conflicts
                </h3>
                <div className="space-y-2">
                  {interactions.interactions.allergyConflicts.map((conflict, index) => (
                    <div key={index} className="text-sm text-red-800 dark:text-red-200">
                      ⚠️ {conflict}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button onClick={() => setInteractions(null)} variant="outline" className="flex-1">
            Check Different Medications
          </Button>
          <Button onClick={() => window.print()} iconName="Printer" className="flex-1">
            Print Report
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="ghost" iconName="ArrowLeft" onClick={onBack}>
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Drug Interaction Checker</h1>
          <p className="text-muted-foreground">Check for potential interactions between your medications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Information */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">Patient Information</h3>
            <div className="space-y-4">
              <Input
                label="Age"
                type="number"
                value={patientInfo.age}
                onChange={(e) => setPatientInfo({...patientInfo, age: e.target.value})}
                placeholder="Enter age"
              />
              
              {/* Medical Conditions */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Medical Conditions</label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    placeholder="e.g., Diabetes, Hypertension"
                    onKeyPress={(e) => e.key === 'Enter' && addCondition()}
                  />
                  <Button onClick={addCondition} iconName="Plus" disabled={!newCondition.trim()}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {patientInfo.conditions.map((condition, index) => (
                    <div key={index} className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      <span>{condition}</span>
                      <button onClick={() => removeCondition(index)}>
                        <Icon name="X" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Allergies */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Allergies</label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    placeholder="e.g., Penicillin, Aspirin"
                    onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                  />
                  <Button onClick={addAllergy} iconName="Plus" disabled={!newAllergy.trim()}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {patientInfo.allergies.map((allergy, index) => (
                    <div key={index} className="flex items-center space-x-1 bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                      <span>{allergy}</span>
                      <button onClick={() => removeAllergy(index)}>
                        <Icon name="X" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Add Medications */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">Add Medications</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Medication Name"
                  value={currentMed.name}
                  onChange={(e) => setCurrentMed({...currentMed, name: e.target.value})}
                  placeholder="e.g., Aspirin"
                />
                <Input
                  label="Dosage"
                  value={currentMed.dosage}
                  onChange={(e) => setCurrentMed({...currentMed, dosage: e.target.value})}
                  placeholder="e.g., 100mg"
                />
                <Input
                  label="Frequency"
                  value={currentMed.frequency}
                  onChange={(e) => setCurrentMed({...currentMed, frequency: e.target.value})}
                  placeholder="e.g., Once daily"
                />
              </div>
              <Button onClick={addMedication} iconName="Plus" disabled={!currentMed.name.trim()}>
                Add Medication
              </Button>
            </div>
          </div>

          {/* Current Medications */}
          {medications.length > 0 && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Current Medications ({medications.length})</h3>
              <div className="space-y-3">
                {medications.map((med) => (
                  <div key={med.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{med.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {med.dosage} {med.frequency && `• ${med.frequency}`}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="Trash2"
                      onClick={() => removeMedication(med.id)}
                      className="text-red-600 hover:text-red-700"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Check Interactions Button */}
          <Button
            onClick={checkInteractions}
            loading={loading}
            disabled={medications.length < 2}
            iconName="Shield"
            className="w-full"
            size="lg"
          >
            Check Drug Interactions
          </Button>
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
              <Icon name="Info" size={20} className="mr-2" />
              How It Works
            </h3>
            <div className="space-y-3 text-sm text-blue-700 dark:text-blue-300">
              <div className="flex items-start space-x-2">
                <Icon name="CheckCircle" size={16} className="mt-0.5" />
                <span>Add your medications and health conditions</span>
              </div>
              <div className="flex items-start space-x-2">
                <Icon name="CheckCircle" size={16} className="mt-0.5" />
                <span>AI analyzes potential interactions</span>
              </div>
              <div className="flex items-start space-x-2">
                <Icon name="CheckCircle" size={16} className="mt-0.5" />
                <span>Get severity ratings and recommendations</span>
              </div>
              <div className="flex items-start space-x-2">
                <Icon name="CheckCircle" size={16} className="mt-0.5" />
                <span>Receive monitoring guidelines</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800 p-6">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-3 flex items-center">
              <Icon name="AlertTriangle" size={20} className="mr-2" />
              Important Notes
            </h3>
            <div className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
              <p>• Always consult your pharmacist or doctor</p>
              <p>• Include all medications, supplements, and herbs</p>
              <p>• Don't stop medications without medical advice</p>
              <p>• This tool is for educational purposes only</p>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center">
              <Icon name="Shield" size={20} className="mr-2 text-green-600" />
              Interaction Types
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Minor - Usually not clinically significant</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Moderate - May require monitoring</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span>Major - Significant risk, avoid if possible</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Contraindicated - Do not use together</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrugInteractionChecker;