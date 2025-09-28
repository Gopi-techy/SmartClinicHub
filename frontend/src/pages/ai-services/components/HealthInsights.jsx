import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const HealthInsights = ({ onBack }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState({
    hasVitals: false,
    hasSymptoms: false,
    hasAppointments: false,
    goals: []
  });

  useEffect(() => {
    // Fetch user's health data when component mounts
    fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      // This would fetch actual patient data from various endpoints
      // For now, we'll simulate some data structure
      setHealthData({
        hasVitals: true,
        hasSymptoms: false,
        hasAppointments: true,
        goals: ['Maintain healthy weight', 'Exercise regularly']
      });
    } catch (error) {
      console.error('Error fetching health data:', error);
    }
  };

  const generateInsights = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('http://localhost:5000/api/ai/health-insights', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          includeVitals: healthData.hasVitals,
          includeSymptoms: healthData.hasSymptoms,
          includeAppointments: healthData.hasAppointments,
          currentGoals: healthData.goals
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate health insights');
      }

      const result = await response.json();
      setInsights(result.data);
    } catch (error) {
      console.error('Error generating insights:', error);
      alert('Failed to generate health insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getHealthScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-100 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  const getRiskLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (insights) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" iconName="ArrowLeft" onClick={onBack}>
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Your Health Insights</h1>
            <p className="text-muted-foreground">Personalized AI-powered health analysis</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Health Score */}
            <div className={`p-6 rounded-lg border-2 ${getHealthScoreColor(insights.insights?.healthScore)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Overall Health Score</h3>
                  <p className="text-sm opacity-90">{insights.insights?.overallHealthStatus}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{insights.insights?.healthScore}/100</div>
                  <div className="text-sm opacity-75">Health Score</div>
                </div>
              </div>
            </div>

            {/* Risk Factors */}
            {insights.insights?.riskFactors?.length > 0 && (
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center">
                  <Icon name="AlertTriangle" size={20} className="mr-2 text-orange-600" />
                  Risk Factor Analysis
                </h3>
                <div className="space-y-3">
                  {insights.insights.riskFactors.map((factor, index) => (
                    <div key={index} className="flex items-start justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{factor.factor}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{factor.description}</p>
                      </div>
                      <div className={`px-3 py-1 rounded text-xs font-medium ${getRiskLevelColor(factor.level)}`}>
                        {factor.level}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vital Trends */}
            {insights.insights?.vitalTrends && (
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center">
                  <Icon name="TrendingUp" size={20} className="mr-2 text-blue-600" />
                  Health Trends
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {Object.entries(insights.insights.vitalTrends).map(([key, trend]) => (
                    <div key={key} className="text-center p-4 bg-muted rounded-lg">
                      <div className="font-medium text-foreground capitalize mb-1">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className={`flex items-center justify-center space-x-1 ${
                        trend === 'improving' ? 'text-green-600' :
                        trend === 'worsening' ? 'text-red-600' :
                        'text-blue-600'
                      }`}>
                        <Icon name={
                          trend === 'improving' ? 'TrendingUp' :
                          trend === 'worsening' ? 'TrendingDown' :
                          'Minus'
                        } size={16} />
                        <span className="text-sm font-medium capitalize">{trend}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lifestyle Recommendations */}
            {insights.insights?.lifestyleRecommendations?.length > 0 && (
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center">
                  <Icon name="Heart" size={20} className="mr-2 text-red-500" />
                  Lifestyle Recommendations
                </h3>
                <div className="space-y-4">
                  {insights.insights.lifestyleRecommendations.map((rec, index) => (
                    <div key={index} className="border border-border rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Icon name={
                          rec.category === 'diet' ? 'Apple' :
                          rec.category === 'exercise' ? 'Zap' :
                          rec.category === 'sleep' ? 'Moon' :
                          'Brain'
                        } size={16} className="text-primary" />
                        <span className="font-medium text-foreground capitalize">{rec.category}</span>
                      </div>
                      <p className="text-sm text-foreground mb-2">{rec.recommendation}</p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Expected benefit:</strong> {rec.impact}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Strengths */}
            {insights.strengths?.length > 0 && (
              <div className="bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800 p-6">
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center">
                  <Icon name="CheckCircle" size={20} className="mr-2" />
                  Your Strengths
                </h3>
                <div className="space-y-2">
                  {insights.strengths.map((strength, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Icon name="Star" size={14} className="text-green-600 mt-0.5" />
                      <span className="text-sm text-green-800 dark:text-green-200">{strength}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improvement Areas */}
            {insights.improvementAreas?.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
                  <Icon name="Target" size={20} className="mr-2" />
                  Areas for Improvement
                </h3>
                <div className="space-y-2">
                  {insights.improvementAreas.map((area, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Icon name="ArrowRight" size={14} className="text-blue-600 mt-0.5" />
                      <span className="text-sm text-blue-800 dark:text-blue-200">{area}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Health Goals */}
            {insights.insights?.healthGoals?.length > 0 && (
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="font-semibold text-foreground mb-3 flex items-center">
                  <Icon name="Target" size={20} className="mr-2 text-purple-600" />
                  Suggested Goals
                </h3>
                <div className="space-y-3">
                  {insights.insights.healthGoals.map((goal, index) => (
                    <div key={index} className="border border-border rounded p-3">
                      <div className="font-medium text-foreground text-sm mb-1">{goal.goal}</div>
                      <div className="text-xs text-muted-foreground mb-2">Timeline: {goal.timeframe}</div>
                      {goal.steps?.length > 0 && (
                        <div className="space-y-1">
                          {goal.steps.map((step, stepIndex) => (
                            <div key={stepIndex} className="flex items-start space-x-1">
                              <Icon name="Dot" size={12} className="text-primary mt-1" />
                              <span className="text-xs text-foreground">{step}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warning Signs */}
            {insights.insights?.warningSignsToWatch?.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800 p-6">
                <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-3 flex items-center">
                  <Icon name="AlertTriangle" size={20} className="mr-2" />
                  Watch For
                </h3>
                <div className="space-y-2">
                  {insights.insights.warningSignsToWatch.map((sign, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Icon name="Eye" size={14} className="text-amber-600 mt-0.5" />
                      <span className="text-sm text-amber-800 dark:text-amber-200">{sign}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button onClick={() => setInsights(null)} variant="outline" className="flex-1">
            Generate New Insights
          </Button>
          <Button onClick={() => window.print()} iconName="Printer" className="flex-1">
            Print Report
          </Button>
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
          <h1 className="text-2xl font-bold text-foreground">Health Insights</h1>
          <p className="text-muted-foreground">Get personalized AI-powered health analysis and recommendations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="TrendingUp" size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Ready to Analyze Your Health?
            </h3>
            <p className="text-muted-foreground mb-6">
              Our AI will analyze your health data including vital signs, symptoms, appointments, and goals 
              to provide personalized insights and recommendations for improving your overall wellness.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="flex items-center space-x-2">
                <Icon name={healthData.hasVitals ? "CheckCircle" : "Circle"} size={16} 
                      className={healthData.hasVitals ? "text-green-600" : "text-gray-400"} />
                <span>Vital Signs Data</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name={healthData.hasAppointments ? "CheckCircle" : "Circle"} size={16} 
                      className={healthData.hasAppointments ? "text-green-600" : "text-gray-400"} />
                <span>Medical History</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name={healthData.hasSymptoms ? "CheckCircle" : "Circle"} size={16} 
                      className={healthData.hasSymptoms ? "text-green-600" : "text-gray-400"} />
                <span>Recent Symptoms</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name={healthData.goals.length > 0 ? "CheckCircle" : "Circle"} size={16} 
                      className={healthData.goals.length > 0 ? "text-green-600" : "text-gray-400"} />
                <span>Health Goals</span>
              </div>
            </div>

            <Button 
              onClick={generateInsights} 
              loading={loading}
              iconName="Brain"
              size="lg"
              className="w-full sm:w-auto"
            >
              Generate Health Insights
            </Button>
          </div>
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
              <Icon name="Info" size={20} className="mr-2" />
              What You'll Get
            </h3>
            <div className="space-y-3 text-sm text-blue-700 dark:text-blue-300">
              <div className="flex items-start space-x-2">
                <Icon name="CheckCircle" size={16} className="mt-0.5" />
                <span>Overall health score assessment</span>
              </div>
              <div className="flex items-start space-x-2">
                <Icon name="CheckCircle" size={16} className="mt-0.5" />
                <span>Personalized risk factor analysis</span>
              </div>
              <div className="flex items-start space-x-2">
                <Icon name="CheckCircle" size={16} className="mt-0.5" />
                <span>Health trend analysis</span>
              </div>
              <div className="flex items-start space-x-2">
                <Icon name="CheckCircle" size={16} className="mt-0.5" />
                <span>Lifestyle recommendations</span>
              </div>
              <div className="flex items-start space-x-2">
                <Icon name="CheckCircle" size={16} className="mt-0.5" />
                <span>Preventive care suggestions</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800 p-6">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center">
              <Icon name="Shield" size={20} className="mr-2" />
              Privacy & Security
            </h3>
            <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
              <p>• Your health data is encrypted and secure</p>
              <p>• Analysis is done with privacy protection</p>
              <p>• No data is stored permanently</p>
              <p>• HIPAA compliant processing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthInsights;