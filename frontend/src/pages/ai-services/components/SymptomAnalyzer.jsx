import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const SymptomAnalyzer = ({ onBack }) => {
  const [symptoms, setSymptoms] = useState([]);
  const [currentSymptom, setCurrentSymptom] = useState('');
  const [severity, setSeverity] = useState(5);
  const [duration, setDuration] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [patientInfo, setPatientInfo] = useState({
    age: '',
    gender: '',
    medicalHistory: []
  });

  const addSymptom = () => {
    if (currentSymptom.trim()) {
      const newSymptom = {
        id: Date.now(),
        name: currentSymptom.trim(),
        severity,
        duration: duration.trim(),
        description: ''
      };
      setSymptoms([...symptoms, newSymptom]);
      setCurrentSymptom('');
      setSeverity(5);
      setDuration('');
    }
  };

  const removeSymptom = (id) => {
    setSymptoms(symptoms.filter(s => s.id !== id));
  };

  const analyzeSymptoms = async () => {
    if (symptoms.length === 0) {
      alert('Please add at least one symptom to analyze.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Show progress message
      const toastId = 'analysis-progress';
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout
      
      const response = await fetch('http://localhost:5000/api/ai/analyze-symptoms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptoms,
          patientInfo,
          medicalHistory: patientInfo.medicalHistory
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
        
        if (response.status === 503) {
          throw new Error(errorData.message || 'AI service is overloaded. Please try again in a few minutes.');
        } else if (response.status === 429) {
          throw new Error(errorData.message || 'Too many requests. Please wait a moment and try again.');
        } else {
          throw new Error(errorData.message || 'Failed to analyze symptoms');
        }
      }

      const result = await response.json();
      
      // Check if we got a valid analysis
      if (result.success && result.analysis) {
        setAnalysisResult(result);
      } else {
        throw new Error(result.message || 'Invalid response from AI service');
      }
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      
      let userMessage = '';
      if (error.name === 'AbortError') {
        userMessage = 'Analysis timeout. The AI service is taking too long to respond. Please try again with fewer symptoms or simpler descriptions.';
      } else if (error.message.includes('session has expired')) {
        return; // Already handled above
      } else if (error.message.includes('overloaded') || error.message.includes('503')) {
        userMessage = '🔄 AI service is currently overloaded due to high traffic. Please wait 2-3 minutes and try again.';
      } else if (error.message.includes('Too many requests') || error.message.includes('429')) {
        userMessage = '⏰ Rate limit reached. Please wait 1 minute before trying again.';
      } else {
        userMessage = `Failed to analyze symptoms: ${error.message}. Please try again.`;
      }
      
      alert(userMessage);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    if (severity <= 3) return 'text-green-600 bg-green-100';
    if (severity <= 6) return 'text-yellow-600 bg-yellow-100';
    if (severity <= 8) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'emergency': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  if (analysisResult) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" iconName="ArrowLeft" onClick={onBack}>
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Symptom Analysis Results</h1>
            <p className="text-muted-foreground">AI-powered analysis of your symptoms</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Urgency Level */}
          <div className={`p-4 rounded-lg border-2 ${getUrgencyColor(analysisResult.analysis?.urgencyLevel)}`}>
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="AlertCircle" size={20} />
              <h3 className="font-semibold">Urgency Level: {analysisResult.analysis?.urgencyLevel?.toUpperCase()}</h3>
            </div>
            <p className="text-sm">{analysisResult.analysis?.urgencyReason}</p>
          </div>

          {/* Possible Conditions */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center">
              <Icon name="Stethoscope" size={20} className="mr-2" />
              Possible Conditions
            </h3>
            <div className="space-y-3">
              {analysisResult.analysis?.possibleConditions?.map((condition, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{condition.condition}</h4>
                    <p className="text-sm text-muted-foreground">{condition.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-primary">{condition.likelihood}</div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      condition.severity === 'mild' ? 'bg-green-100 text-green-700' :
                      condition.severity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {condition.severity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Immediate Actions */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center">
              <Icon name="CheckCircle" size={20} className="mr-2 text-green-600" />
              Recommended Immediate Actions
            </h3>
            <div className="space-y-2">
              {analysisResult.analysis?.immediateActions?.map((action, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <Icon name="ArrowRight" size={16} className="text-primary mt-0.5" />
                  <span className="text-sm text-foreground">{action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* When to Seek Medical Attention */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center">
              <Icon name="Clock" size={20} className="mr-2 text-orange-600" />
              When to Seek Medical Attention
            </h3>
            <p className="text-sm text-foreground">{analysisResult.analysis?.seekMedicalAttention}</p>
          </div>

          {/* Home Care Recommendations */}
          {analysisResult.analysis?.homeCare?.length > 0 && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center">
                <Icon name="Home" size={20} className="mr-2 text-blue-600" />
                Home Care Recommendations
              </h3>
              <div className="space-y-2">
                {analysisResult.analysis.homeCare.map((care, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Icon name="Heart" size={16} className="text-blue-600 mt-0.5" />
                    <span className="text-sm text-foreground">{care}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medication Guidance */}
          {analysisResult.analysis?.medicationGuidance?.length > 0 && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center">
                <Icon name="Pill" size={20} className="mr-2 text-purple-600" />
                Medication Guidance
              </h3>
              <div className="space-y-6">
                {analysisResult.analysis.medicationGuidance.map((category, categoryIndex) => (
                  <div key={categoryIndex} className="border border-border rounded-lg p-4">
                    <h4 className="font-medium text-foreground mb-3 text-purple-800 dark:text-purple-200">
                      {category.category}
                    </h4>
                    <div className="space-y-4">
                      {category.medications.map((med, medIndex) => (
                        <div key={medIndex} className="bg-muted rounded p-3">
                          <div className="font-medium text-foreground mb-2 flex items-center">
                            <Icon name="Zap" size={16} className="mr-2 text-purple-600" />
                            {med.name}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="font-medium text-muted-foreground">Dosage:</span>
                              <p className="text-foreground">{med.dosage}</p>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">Duration:</span>
                              <p className="text-foreground">{med.duration}</p>
                            </div>
                          </div>
                          <div className="mt-2 text-sm">
                            <p className="text-foreground"><strong>Instructions:</strong> {med.instructions}</p>
                          </div>
                          <div className="mt-2 text-sm bg-amber-50 dark:bg-amber-950 p-2 rounded">
                            <p className="text-amber-800 dark:text-amber-200">
                              <strong>⚠️ Precautions:</strong> {med.precautions}
                            </p>
                          </div>
                        </div>
                      ))}
                      {category.generalAdvice && (
                        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded border border-blue-200 dark:border-blue-800">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>💡 General Advice:</strong> {category.generalAdvice}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Treatment Plan */}
          {analysisResult.analysis?.treatmentPlan?.length > 0 && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center">
                <Icon name="Calendar" size={20} className="mr-2 text-green-600" />
                Treatment Plan
              </h3>
              <div className="space-y-4">
                {analysisResult.analysis.treatmentPlan.map((phase, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <h4 className="font-medium text-green-800 dark:text-green-200 mb-3 flex items-center">
                      <Icon name="Clock" size={16} className="mr-2" />
                      {phase.phase}
                    </h4>
                    <div className="space-y-2">
                      {phase.actions.map((action, actionIndex) => (
                        <div key={actionIndex} className="flex items-start space-x-2">
                          <Icon name="CheckCircle" size={16} className="text-green-600 mt-0.5" />
                          <span className="text-sm text-foreground">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Self-Care Recommendations */}
          {analysisResult.analysis?.selfCare?.length > 0 && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center">
                <Icon name="Heart" size={20} className="mr-2 text-blue-600" />
                Self-Care Recommendations
              </h3>
              <div className="space-y-3">
                {analysisResult.analysis.selfCare.map((care, index) => (
                  <div key={index} className="border border-border rounded p-3">
                    <div className="font-medium text-foreground mb-2">{care.suggestion}</div>
                    <div className="text-sm text-muted-foreground mb-1">
                      <strong>Duration:</strong> {care.duration}
                    </div>
                    {care.precautions && (
                      <div className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 p-2 rounded">
                        <strong>⚠️ Precautions:</strong> {care.precautions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysisResult.analysis?.recommendations?.length > 0 && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center">
                <Icon name="CheckCircle" size={20} className="mr-2 text-green-600" />
                Medical Recommendations
              </h3>
              <div className="space-y-3">
                {analysisResult.analysis.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-2 p-3 bg-muted rounded">
                    <Icon name="ArrowRight" size={16} className="text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{rec.action}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <strong>Timeframe:</strong> {rec.timeframe} • <strong>Importance:</strong> {rec.importance}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Important Notes */}
          {analysisResult.analysis?.importantNotes?.length > 0 && (
            <div className="bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800 p-6">
              <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-4 flex items-center">
                <Icon name="AlertTriangle" size={20} className="mr-2" />
                Important Medication Safety Notes
              </h3>
              <div className="space-y-2">
                {analysisResult.analysis.importantNotes.map((note, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Icon name="Info" size={16} className="text-orange-600 mt-0.5" />
                    <span className="text-sm text-orange-800 dark:text-orange-200">{note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning Signs */}
          {analysisResult.analysis?.redFlags?.length > 0 && (
            <div className="bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800 p-6">
              <h3 className="font-semibold text-red-800 dark:text-red-200 mb-4 flex items-center">
                <Icon name="AlertTriangle" size={20} className="mr-2" />
                Warning Signs to Watch For
              </h3>
              <div className="space-y-2">
                {analysisResult.analysis.redFlags.map((flag, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Icon name="AlertCircle" size={16} className="text-red-600 mt-0.5" />
                    <span className="text-sm text-red-800 dark:text-red-200">{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800 p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Disclaimer:</strong> {analysisResult.disclaimer}
            </p>
          </div>



          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={() => setAnalysisResult(null)} variant="outline" className="flex-1">
              Analyze Different Symptoms
            </Button>
            <Button onClick={() => window.print()} iconName="Printer" className="flex-1">
              Print Results
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
          <h1 className="text-2xl font-bold text-foreground">Symptom Analyzer</h1>
          <p className="text-muted-foreground">Describe your symptoms to get AI-powered health insights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Information */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Age"
                type="number"
                value={patientInfo.age}
                onChange={(e) => setPatientInfo({...patientInfo, age: e.target.value})}
                placeholder="Enter your age"
              />
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Gender</label>
                <select 
                  value={patientInfo.gender} 
                  onChange={(e) => setPatientInfo({...patientInfo, gender: e.target.value})}
                  className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Add Symptoms */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">Add Symptoms</h3>
            <div className="space-y-4">
              <Input
                label="Symptom"
                value={currentSymptom}
                onChange={(e) => setCurrentSymptom(e.target.value)}
                placeholder="e.g., Headache, Fever, Cough"
                onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Severity (1-10): {severity}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={severity}
                    onChange={(e) => setSeverity(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Mild</span>
                    <span>Severe</span>
                  </div>
                </div>
                <Input
                  label="Duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 2 days, 1 week"
                />
              </div>
              <Button onClick={addSymptom} iconName="Plus" disabled={!currentSymptom.trim()}>
                Add Symptom
              </Button>
            </div>
          </div>

          {/* Current Symptoms */}
          {symptoms.length > 0 && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Current Symptoms ({symptoms.length})</h3>
              <div className="space-y-3">
                {symptoms.map((symptom) => (
                  <div key={symptom.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{symptom.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center space-x-4">
                        <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(symptom.severity)}`}>
                          Severity: {symptom.severity}/10
                        </span>
                        {symptom.duration && (
                          <span>Duration: {symptom.duration}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="Trash2"
                      onClick={() => removeSymptom(symptom.id)}
                      className="text-red-600 hover:text-red-700"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analyze Button */}
          <Button
            onClick={analyzeSymptoms}
            loading={loading}
            disabled={symptoms.length === 0}
            iconName={loading ? "Loader" : "Brain"}
            className="w-full"
            size="lg"
          >
            {loading ? "Analyzing with AI... (30-60 seconds)" : "Analyze Symptoms with AI"}
          </Button>

          {/* Loading Progress Message */}
          {loading && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    🤖 AI is analyzing your symptoms...
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Connecting to Google Gemini AI • This may take 30-60 seconds
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* AI Status Info */}
          {!loading && !analysisResult && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-800 dark:text-green-200">
                  ✅ Real AI powered by Google Gemini is ready
                </span>
              </div>
            </div>
          )}
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
                <span>Describe your symptoms in detail</span>
              </div>
              <div className="flex items-start space-x-2">
                <Icon name="CheckCircle" size={16} className="mt-0.5" />
                <span>Rate severity and duration</span>
              </div>
              <div className="flex items-start space-x-2">
                <Icon name="CheckCircle" size={16} className="mt-0.5" />
                <span>AI analyzes patterns and conditions</span>
              </div>
              <div className="flex items-start space-x-2">
                <Icon name="CheckCircle" size={16} className="mt-0.5" />
                <span>Get personalized recommendations</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800 p-6">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-3 flex items-center">
              <Icon name="AlertTriangle" size={20} className="mr-2" />
              Important Notes
            </h3>
            <div className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
              <p>• This tool provides educational information only</p>
              <p>• Not a substitute for professional medical advice</p>
              <p>• For emergencies, call 112 immediately</p>
              <p>• Always consult healthcare providers for diagnosis</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SymptomAnalyzer;