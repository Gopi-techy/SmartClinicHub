import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import RoleBasedHeader from '../../components/ui/RoleBasedHeader';
import PatientSidebar from '../../components/ui/PatientSidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import SymptomAnalyzer from './components/SymptomAnalyzer';
import HealthInsights from './components/HealthInsights';
import DrugInteractionChecker from './components/DrugInteractionChecker';
import EmergencyGuidance from './components/EmergencyGuidance';
const AIServices = () => {
  const { user } = useAuth();
  const [activeService, setActiveService] = useState(null);



  const services = [
    {
      id: 'symptom-analyzer',
      title: 'Symptom Analyzer',
      description: 'Get AI-powered analysis of your symptoms and health concerns',
      icon: 'Stethoscope',
      color: 'bg-blue-500',
      component: SymptomAnalyzer
    },
    {
      id: 'health-insights',
      title: 'Health Insights',
      description: 'Receive personalized health recommendations and insights',
      icon: 'TrendingUp',
      color: 'bg-green-500',
      component: HealthInsights
    },
    {
      id: 'drug-checker',
      title: 'Drug Interaction Checker',
      description: 'Check for potential interactions between your medications',
      icon: 'Pill',
      color: 'bg-orange-500',
      component: DrugInteractionChecker
    },
    {
      id: 'emergency-guidance',
      title: 'Emergency Guidance',
      description: 'Get immediate AI guidance for emergency medical situations',
      icon: 'AlertTriangle',
      color: 'bg-red-500',
      component: EmergencyGuidance
    }
  ];

  const renderActiveService = () => {
    const service = services.find(s => s.id === activeService);
    if (!service) return null;

    const ServiceComponent = service.component;
    return <ServiceComponent onBack={() => setActiveService(null)} />;
  };

  if (activeService) {
    return (
      <>
        <Helmet>
          <title>AI Health Assistant - SmartClinicHub</title>
          <meta name="description" content="AI-powered health assistant providing symptom analysis, health insights, and emergency guidance." />
        </Helmet>
        
        <div className="min-h-screen bg-background">
          <RoleBasedHeader />
          <PatientSidebar />
          
          <main className="md:ml-64 pt-16">
            {renderActiveService()}
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>AI Health Assistant - SmartClinicHub</title>
        <meta name="description" content="AI-powered health assistant providing symptom analysis, health insights, and emergency guidance." />
        <meta name="keywords" content="AI health assistant, symptom analyzer, health insights, medical AI, emergency guidance" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <RoleBasedHeader />
        <PatientSidebar />
        
        <main className="md:ml-64 pt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Icon name="Brain" size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                    AI Health Assistant
                  </h1>
                  <p className="text-muted-foreground">
                    Powered by advanced AI technology to support your healthcare journey
                  </p>
                </div>
              </div>
              
              {/* Welcome Message */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon name="Sparkles" size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Welcome to your AI Health Assistant, {user?.firstName || 'there'}!
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Our AI-powered tools are designed to provide intelligent health insights and guidance. 
                      Please remember that AI recommendations should complement, not replace, professional medical advice.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <div className="inline-flex items-center space-x-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                        <Icon name="Shield" size={12} />
                        <span>HIPAA Compliant</span>
                      </div>
                      <div className="inline-flex items-center space-x-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                        <Icon name="Lock" size={12} />
                        <span>Secure & Private</span>
                      </div>
                      <div className="inline-flex items-center space-x-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                        <Icon name="Zap" size={12} />
                        <span>Powered by Gemini AI</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>



            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group hover:border-primary/20"
                  onClick={() => setActiveService(service.id)}
                >
                  <div className="flex flex-col h-full">
                    <div className={`w-12 h-12 ${service.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                      <Icon name={service.icon} size={24} className="text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 flex-grow">
                      {service.description}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      iconName="ArrowRight"
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary"
                    >
                      Try Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Features & Benefits */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* How It Works */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <Icon name="HelpCircle" size={20} className="mr-2" />
                  How It Works
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Share Your Information</p>
                      <p className="text-sm text-muted-foreground">Provide symptoms, health data, or medications</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-foreground">AI Analysis</p>
                      <p className="text-sm text-muted-foreground">Our AI processes your information using medical knowledge</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Get Insights</p>
                      <p className="text-sm text-muted-foreground">Receive personalized recommendations and guidance</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Disclaimer */}
              <div className="bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800 p-6">
                <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-4 flex items-center">
                  <Icon name="AlertTriangle" size={20} className="mr-2" />
                  Important Disclaimer
                </h3>
                <div className="space-y-3 text-sm text-amber-700 dark:text-amber-300">
                  <p>
                    <strong>Medical Advice:</strong> AI recommendations are for informational purposes only and do not constitute medical advice.
                  </p>
                  <p>
                    <strong>Emergency Situations:</strong> For medical emergencies, call emergency services immediately (112 or your local emergency number).
                  </p>
                  <p>
                    <strong>Professional Consultation:</strong> Always consult with qualified healthcare professionals for medical decisions.
                  </p>
                  <p>
                    <strong>Accuracy:</strong> While our AI is trained on medical data, it may not always be 100% accurate.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-lg border border-border p-4 text-center">
                <div className="text-2xl font-bold text-primary mb-1">24/7</div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
              <div className="bg-card rounded-lg border border-border p-4 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">~2min</div>
                <div className="text-sm text-muted-foreground">Response Time</div>
              </div>
              <div className="bg-card rounded-lg border border-border p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">4</div>
                <div className="text-sm text-muted-foreground">AI Services</div>
              </div>
              <div className="bg-card rounded-lg border border-border p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">100%</div>
                <div className="text-sm text-muted-foreground">Private</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AIServices;