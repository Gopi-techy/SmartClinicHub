import React, { useState, useEffect } from 'react';
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
  const [isApiAvailable, setIsApiAvailable] = useState(true);
  
  // Check if the AI API is available on component mount
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/health', {
          method: 'GET',
          timeout: 3000 // 3 second timeout
        });
        
        setIsApiAvailable(response.ok);
      } catch (error) {
        console.log('API health check failed:', error);
        setIsApiAvailable(false);
      }
    };
    
    checkApiStatus();
  }, []);

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
  
  // Function to generate mock emergency guidance based on the selected emergency type
  const generateMockGuidance = () => {
    // Default values
    let priority = 'high';
    let callEmergencyServices = true;
    let emergencyNumber = '112';
    let immediateActions = [];
    let stepByStepInstructions = [];
    let contraindications = [];
    let monitoringPoints = [];
    let warningSignsToWatch = [];
    let positioningGuidance = '';
    let cprInstructions = { required: false, steps: [] };
    
    // Generate guidance based on emergency type
    switch (emergencyData.emergencyType) {
      case 'Cardiac Emergency':
        priority = 'critical';
        immediateActions = [
          { step: 1, action: 'Call emergency services (112) immediately', timeframe: 'Now' },
          { step: 2, action: 'Check if the person is responsive', timeframe: 'Immediately' },
          { step: 3, action: 'If unresponsive, check for breathing', timeframe: 'Within 10 seconds' },
          { step: 4, action: 'If not breathing normally, begin CPR', timeframe: 'Immediately' }
        ];
        stepByStepInstructions = [
          { step: 1, instruction: 'Place the person on their back on a firm surface', important: 'Make sure the area is safe' },
          { step: 2, instruction: "Kneel beside the person's chest", important: '' },
          { step: 3, instruction: 'Place the heel of one hand on the center of the chest', important: 'Between the nipples' },
          { step: 4, instruction: 'Place your other hand on top and interlock fingers', important: 'Keep arms straight' },
          { step: 5, instruction: 'Compress the chest at least 5-6 cm deep at a rate of 100-120 compressions per minute', important: 'Allow chest to recoil completely between compressions' }
        ];
        contraindications = [
          'Do not move the person unless necessary',
          'Do not give food or water',
          'Do not leave the person alone'
        ];
        monitoringPoints = [
          'Breathing patterns',
          'Skin color (pale, blue, or normal)',
          'Level of consciousness'
        ];
        warningSignsToWatch = [
          'Cessation of breathing',
          'Loss of consciousness',
          'Blue or gray skin color'
        ];
        positioningGuidance = 'Keep the person lying flat on their back on a firm surface for CPR. If they are breathing and unconscious, place them in the recovery position (on their side).';  
        cprInstructions = {
          required: true,
          steps: [
            'Push hard and fast in the center of the chest (100-120 compressions per minute)',
            'Compress to a depth of at least 5-6 cm (2 inches)',
            'Allow complete chest recoil between compressions',
            'Minimize interruptions to chest compressions',
            'Continue CPR until emergency services arrive or an AED becomes available'
          ]
        };
        break;
        
      case 'Breathing Difficulty':
        priority = 'high';
        immediateActions = [
          { step: 1, action: 'Call emergency services (112)', timeframe: 'Now' },
          { step: 2, action: 'Help the person into a comfortable position that makes breathing easier', timeframe: 'Immediately' },
          { step: 3, action: 'Loosen any tight clothing', timeframe: 'Immediately' },
          { step: 4, action: 'Ensure fresh air is available', timeframe: 'Immediately' }
        ];
        stepByStepInstructions = [
          { step: 1, instruction: 'Help the person sit upright, leaning slightly forward', important: 'This position helps maximize lung expansion' },
          { step: 2, instruction: 'Loosen any tight clothing around the neck or chest', important: '' },
          { step: 3, instruction: 'If the person has medication for breathing problems (like an inhaler), help them use it', important: 'Follow the prescription instructions' },
          { step: 4, instruction: 'Encourage slow, deep breaths', important: 'In through the nose, out through the mouth' }
        ];
        contraindications = [
          'Do not have the person lie flat',
          'Do not give food or drink',
          'Do not leave the person alone'
        ];
        monitoringPoints = [
          'Breathing rate and difficulty',
          'Skin color (watch for bluish tint)',
          'Level of consciousness'
        ];
        warningSignsToWatch = [
          'Blue lips or fingernails',
          'Inability to speak in full sentences',
          'Confusion or drowsiness',
          'Gasping for air or very rapid breathing'
        ];
        positioningGuidance = 'Have the person sit upright, leaning slightly forward with arms resting on a table if available. This position helps open airways and makes breathing easier.';  
        break;
        
      case 'Severe Bleeding':
        priority = 'critical';
        immediateActions = [
          { step: 1, action: 'Call emergency services (112)', timeframe: 'Now' },
          { step: 2, action: 'Apply direct pressure to the wound', timeframe: 'Immediately' },
          { step: 3, action: 'Elevate the wounded area if possible', timeframe: 'After applying pressure' },
          { step: 4, action: 'Secure a clean bandage or cloth over the wound', timeframe: 'As soon as available' }
        ];
        stepByStepInstructions = [
          { step: 1, instruction: 'Apply firm pressure directly on the wound using a clean cloth, bandage, or your hand', important: 'Use gloves if available to prevent infection' },
          { step: 2, instruction: 'Maintain pressure for at least 15 minutes', important: 'Do not release pressure to check the wound' },
          { step: 3, instruction: 'If blood soaks through, add another cloth on top and continue pressure', important: 'Do not remove the first cloth' },
          { step: 4, instruction: 'Once bleeding slows, secure a clean bandage tightly over the wound', important: 'Ensure bandage is tight but not cutting off circulation' }
        ];
        contraindications = [
          'Do not remove objects embedded in the wound',
          'Do not apply a tourniquet unless specifically trained',
          'Do not clean the wound deeply - focus on stopping bleeding'
        ];
        monitoringPoints = [
          'Amount of blood loss',
          'Pulse and skin color',
          'Signs of shock (pale skin, rapid breathing, confusion)'
        ];
        warningSignsToWatch = [
          'Blood spurting from wound',
          "Blood that won't stop flowing after 15 minutes of pressure",
          'Signs of shock (confusion, cold/clammy skin, rapid pulse)'
        ];
        positioningGuidance = 'Have the person lie down and elevate the injured area above the heart level if possible. If you suspect a head, neck, or spine injury, keep the person still and do not move them.';  
        break;
        
      // Add mock guidance for other emergency types
      default:
        priority = 'high';
        immediateActions = [
          { step: 1, action: 'Call emergency services (112)', timeframe: 'Now' },
          { step: 2, action: 'Stay with the person and keep them calm', timeframe: 'Continuously' },
          { step: 3, action: 'Monitor their condition', timeframe: 'Continuously' }
        ];
        stepByStepInstructions = [
          { step: 1, instruction: 'Call 112 and provide your exact location', important: 'Stay on the line with the dispatcher' },
          { step: 2, instruction: 'Follow the emergency dispatcher\'s instructions', important: 'They will guide you through necessary steps' },
          { step: 3, instruction: 'Keep the person comfortable and calm', important: 'Speak in a reassuring voice' }
        ];
        contraindications = ['Do not leave the person alone', 'Do not move the person unless necessary'];
        monitoringPoints = ['Breathing', 'Consciousness', 'Pulse', 'Changes in condition'];
        warningSignsToWatch = ['Loss of consciousness', 'Difficulty breathing', 'Worsening symptoms'];
        positioningGuidance = 'Keep the person comfortable. If they are unconscious but breathing, place them in the recovery position (on their side).';  
        break;
    }
    
    return {
      data: {
        guidance: {
          priority,
          callEmergencyServices,
          emergencyNumber,
          immediateActions,
          stepByStepInstructions,
          contraindications,
          monitoringPoints,
          warningSignsToWatch,
          positioningGuidance,
          cprInstructions
        },
        criticalNote: `${priority.toUpperCase()} PRIORITY: ${emergencyData.emergencyType}`,
        disclaimer: isApiAvailable ? 
          'This guidance is provided by an AI system for educational purposes. Always follow the advice of emergency dispatchers and medical professionals.' : 
          'AI service is currently unavailable. This is simulated emergency guidance using predefined protocols. Always call emergency services for real emergencies.'
      }
    };
  };

  const getEmergencyGuidance = async () => {
    if (!emergencyData.emergencyType) {
      alert('Please select an emergency type to get guidance.');
      return;
    }

    setLoading(true);
    
    // If API is not available, use mock data after a simulated delay
    if (!isApiAvailable) {
      setTimeout(() => {
        const mockResult = generateMockGuidance();
        setGuidance(mockResult.data);
        setLoading(false);
      }, 1500); // 1.5 second simulated delay
      return;
    }
    
    // Otherwise proceed with real API call
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
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
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('authToken');
        alert('Your session has expired. Please log in again.');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to get emergency guidance');
      }

      const result = await response.json();
      setGuidance(result.data);
    } catch (error) {
      console.error('Error getting emergency guidance:', error);
      
      // Generate context-specific mock data based on the selected emergency type
      const mockResult = generateMockGuidance();
      setGuidance(mockResult.data);
      
      // Only show alert for certain errors
      if (error.name !== 'AbortError' && !error.message.includes('Failed to fetch')) {
        alert('Unable to connect to AI service. Using predefined emergency guidance protocols.');
      }
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
          <div className="space-y-3">
            <Button
              onClick={getEmergencyGuidance}
              loading={loading}
              disabled={!emergencyData.emergencyType}
              iconName="AlertTriangle"
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              {loading ? 
              `${isApiAvailable ? 'Analyzing Emergency...' : 'Preparing Guidance...'}` : 
              `Get Emergency Guidance {!isApiAvailable && '(Using Protocols)'}${!isApiAvailable ? ' (Using Protocols)' : ''}`
            }
            </Button>
            
            {/* API Status Indicator */}
            {!isApiAvailable && (
              <div className="p-2 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  <span className="text-amber-800 dark:text-amber-200">
                    ⚠️ Using predefined protocols - AI service is unavailable
                  </span>
                </div>
              </div>
            )}
          </div>
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