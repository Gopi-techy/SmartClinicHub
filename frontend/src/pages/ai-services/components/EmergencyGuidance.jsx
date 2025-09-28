import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const EmergencyGuidance = ({ onBack }) => {
  const [emergencyData, setEmergencyData] = useState({
    emergencyType: '',
    symptoms: [],
    patientAge: '',
    location: ''
  });
  const [currentSymptom, setCurrentSymptom] = useState('');
  const [guidance, setGuidance] = useState(null);
  const [loading, setLoading] = useState(false);

  const emergencyTypes = [
    'Cardiac Emergency',
    'Breathing Difficulty',
    'Severe Bleeding',
    'Unconsciousness',
    'Stroke',
    'Allergic Reaction',
    'Poisoning',
    'Burns',
    'Choking',
    'Seizure',
    'Trauma/Injury',
    'Other'
  ];

  const addSymptom = () => {
    if (currentSymptom.trim()) {
      setEmergencyData({
        ...emergencyData,
        symptoms: [...emergencyData.symptoms, currentSymptom.trim()]
      });
      setCurrentSymptom('');
    }
  };

  const removeSymptom = (index) => {
    setEmergencyData({
      ...emergencyData,
      symptoms: emergencyData.symptoms.filter((_, i) => i !== index)
    });
  };

  const getEmergencyGuidance = async () => {
    if (!emergencyData.emergencyType) {
      alert('Please select an emergency type to get guidance.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('http://localhost:5000/api/ai/emergency-guidance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emergencyType: emergencyData.emergencyType,
          symptoms: emergencyData.symptoms,
          patientInfo: {
            age: emergencyData.patientAge
          },
          location: emergencyData.location
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get emergency guidance');
      }

      const result = await response.json();
      setGuidance(result.data);
    } catch (error) {
      console.error('Error getting emergency guidance:', error);
      // Show fallback emergency guidance
      setGuidance({
        guidance: {
          priority: 'critical',
          callEmergencyServices: true,
          emergencyNumber: '112',
          immediateActions: [
            {
              step: 1,
              action: 'Call emergency services immediately',
              timeframe: 'Now'
            },
            {
              step: 2,
              action: 'Stay with the patient and keep them calm',
              timeframe: 'Continuously'
            }
          ],
          stepByStepInstructions: [
            {
              step: 1,
              instruction: 'Call 112 and provide your exact location',
              important: 'Stay on the line with the dispatcher'
            }
          ],
          contraindications: ['Do not leave patient alone'],
          monitoringPoints: ['Breathing', 'Consciousness', 'Pulse'],
          warningSignsToWatch: ['Loss of consciousness', 'Stopped breathing']
        },
        criticalNote: 'EMERGENCY SERVICES SHOULD BE CONTACTED IMMEDIATELY',
        disclaimer: 'AI service temporarily unavailable. Please contact emergency services immediately.'
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (guidance) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" iconName="ArrowLeft" onClick={onBack}>
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Emergency Guidance</h1>
            <p className="text-muted-foreground">Immediate AI-powered emergency assistance</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Critical Alert */}
          <div className="bg-red-50 dark:bg-red-950 rounded-lg border-2 border-red-200 dark:border-red-800 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <Icon name="AlertTriangle" size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-800 dark:text-red-200">
                  {guidance.criticalNote || 'EMERGENCY GUIDANCE'}
                </h2>
                <p className="text-red-700 dark:text-red-300">
                  Priority: <span className="font-semibold uppercase">{guidance.guidance?.priority}</span>
                </p>
              </div>
            </div>

            {/* Emergency Services */}
            {guidance.guidance?.callEmergencyServices && (
              <div className="bg-red-600 text-white p-4 rounded-lg mb-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Icon name="Phone" size={20} />
                  <span className="text-lg font-semibold">
                    CALL {guidance.guidance.emergencyNumber || '112'} IMMEDIATELY
                  </span>
                </div>
                <p className="text-sm opacity-90">
                  Emergency services should be contacted right away for this situation.
                </p>
              </div>
            )}
          </div>

          {/* Immediate Actions */}
          {guidance.guidance?.immediateActions?.length > 0 && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center">
                <Icon name="Zap" size={20} className="mr-2 text-orange-600" />
                Immediate Actions (DO NOW)
              </h3>
              <div className="space-y-3">
                {guidance.guidance.immediateActions.map((action, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                      {action.step}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-orange-900 dark:text-orange-100">{action.action}</div>
                      <div className="text-sm text-orange-700 dark:text-orange-300">
                        Timeframe: {action.timeframe}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step-by-Step Instructions */}
          {guidance.guidance?.stepByStepInstructions?.length > 0 && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center">
                <Icon name="List" size={20} className="mr-2 text-blue-600" />
                Detailed Instructions
              </h3>
              <div className="space-y-4">
                {guidance.guidance.stepByStepInstructions.map((instruction, index) => (
                  <div key={index} className="border border-border rounded p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                        {instruction.step}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-foreground mb-2">{instruction.instruction}</div>
                        {instruction.important && (
                          <div className="text-sm text-blue-600 bg-blue-50 dark:bg-blue-950 p-2 rounded">
                            <strong>Important:</strong> {instruction.important}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* What NOT to Do */}
            {guidance.guidance?.contraindications?.length > 0 && (
              <div className="bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800 p-6">
                <h3 className="font-semibold text-red-800 dark:text-red-200 mb-4 flex items-center">
                  <Icon name="X" size={20} className="mr-2" />
                  DO NOT Do These
                </h3>
                <div className="space-y-2">
                  {guidance.guidance.contraindications.map((item, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Icon name="XCircle" size={16} className="text-red-600 mt-0.5" />
                      <span className="text-sm text-red-800 dark:text-red-200">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monitoring Points */}
            {guidance.guidance?.monitoringPoints?.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-4 flex items-center">
                  <Icon name="Eye" size={20} className="mr-2" />
                  Monitor Continuously
                </h3>
                <div className="space-y-2">
                  {guidance.guidance.monitoringPoints.map((point, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Icon name="CheckCircle" size={16} className="text-blue-600 mt-0.5" />
                      <span className="text-sm text-blue-800 dark:text-blue-200">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CPR Instructions */}
          {guidance.guidance?.cprInstructions?.required && (
            <div className="bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800 p-6">
              <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-4 flex items-center">
                <Icon name="Heart" size={20} className="mr-2" />
                CPR Instructions
              </h3>
              <div className="space-y-2">
                {guidance.guidance.cprInstructions.steps?.map((step, index) => (
                  <div key={index} className="text-sm text-amber-800 dark:text-amber-200">
                    • {step}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning Signs */}
          {guidance.guidance?.warningSignsToWatch?.length > 0 && (
            <div className="bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800 p-6">
              <h3 className="font-semibold text-red-800 dark:text-red-200 mb-4 flex items-center">
                <Icon name="AlertTriangle" size={20} className="mr-2" />
                Critical Warning Signs
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                If you notice any of these signs, the situation is becoming more critical:
              </p>
              <div className="space-y-2">
                {guidance.guidance.warningSignsToWatch.map((sign, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Icon name="AlertCircle" size={16} className="text-red-600 mt-0.5" />
                    <span className="text-sm text-red-800 dark:text-red-200 font-medium">{sign}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Positioning Guidance */}
          {guidance.guidance?.positioningGuidance && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="font-semibold text-foreground mb-3 flex items-center">
                <Icon name="Move" size={20} className="mr-2 text-green-600" />
                Patient Positioning
              </h3>
              <p className="text-sm text-foreground">{guidance.guidance.positioningGuidance}</p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800 p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Important:</strong> {guidance.disclaimer}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={() => window.location.href = 'tel:112'} 
              iconName="Phone" 
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Call Emergency Services (112)
            </Button>
            <Button onClick={() => setGuidance(null)} variant="outline" className="flex-1">
              Get Different Guidance
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="ghost" iconName="ArrowLeft" onClick={onBack}>
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Emergency Guidance</h1>
          <p className="text-muted-foreground">Get immediate AI-powered guidance for emergency situations</p>
        </div>
      </div>

      {/* Emergency Warning */}
      <div className="bg-red-50 dark:bg-red-950 rounded-lg border-2 border-red-200 dark:border-red-800 p-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
            <Icon name="Phone" size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-800 dark:text-red-200">
              FOR IMMEDIATE EMERGENCIES
            </h2>
            <p className="text-red-700 dark:text-red-300">
              If this is a life-threatening emergency, call 112 immediately
            </p>
          </div>
        </div>
        <Button 
          onClick={() => window.location.href = 'tel:112'} 
          iconName="Phone" 
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Call Emergency Services (112)
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Emergency Type */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">Emergency Type</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {emergencyTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setEmergencyData({...emergencyData, emergencyType: type})}
                  className={`p-3 text-left rounded-lg border transition-colors ${
                    emergencyData.emergencyType === type
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">Current Symptoms</h3>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={currentSymptom}
                  onChange={(e) => setCurrentSymptom(e.target.value)}
                  placeholder="Describe symptoms..."
                  onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
                />
                <Button onClick={addSymptom} iconName="Plus" disabled={!currentSymptom.trim()}>
                  Add
                </Button>
              </div>
              {emergencyData.symptoms.length > 0 && (
                <div className="space-y-2">
                  {emergencyData.symptoms.map((symptom, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm text-foreground">{symptom}</span>
                      <button onClick={() => removeSymptom(index)}>
                        <Icon name="X" size={14} className="text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">Additional Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Patient Age"
                type="number"
                value={emergencyData.patientAge}
                onChange={(e) => setEmergencyData({...emergencyData, patientAge: e.target.value})}
                placeholder="Age in years"
              />
              <Input
                label="Location"
                value={emergencyData.location}
                onChange={(e) => setEmergencyData({...emergencyData, location: e.target.value})}
                placeholder="Current location"
              />
            </div>
          </div>

          {/* Get Guidance Button */}
          <Button
            onClick={getEmergencyGuidance}
            loading={loading}
            disabled={!emergencyData.emergencyType}
            iconName="AlertTriangle"
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            size="lg"
          >
            Get Emergency Guidance
          </Button>
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          <div className="bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800 p-6">
            <h3 className="font-semibold text-red-800 dark:text-red-200 mb-3 flex items-center">
              <Icon name="AlertTriangle" size={20} className="mr-2" />
              Emergency Numbers
            </h3>
            <div className="space-y-2 text-sm text-red-700 dark:text-red-300">
              <div className="flex justify-between">
                <span>Emergency Services:</span>
                <strong>112</strong>
              </div>
              <div className="flex justify-between">
                <span>Poison Control:</span>
                <strong>112</strong>
              </div>
              <div className="flex justify-between">
                <span>Fire Department:</span>
                <strong>112</strong>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
              <Icon name="Info" size={20} className="mr-2" />
              What You'll Get
            </h3>
            <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
              <p>• Immediate action steps</p>
              <p>• Step-by-step instructions</p>
              <p>• What NOT to do</p>
              <p>• Monitoring guidelines</p>
              <p>• CPR instructions if needed</p>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800 p-6">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-3 flex items-center">
              <Icon name="Clock" size={20} className="mr-2" />
              Time Critical
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              In emergency situations, every second counts. This tool provides immediate guidance while you wait for emergency services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyGuidance;