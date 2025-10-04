import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import RoleBasedHeader from '../../components/ui/RoleBasedHeader';
import PatientSidebar from '../../components/ui/PatientSidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import SymptomAnalyzer from './components/SymptomAnalyzer';
import EmergencyGuidance from './components/EmergencyGuidance';
import MedicalChatWidget from '../../components/ui/MedicalChatWidget';
const AIServices = () => {
  const { user } = useAuth();
  const [activeService, setActiveService] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I'm your medical assistant. I can help answer general health questions and provide medical information. Please remember that I'm not a substitute for professional medical advice. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = React.useRef(null);
  const messagesContainerRef = React.useRef(null);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;
    
    // Capture message text first, then clear input immediately
    const messageText = inputValue.trim();
    setInputValue('');
    
    // Add user message after input is cleared
    const userMessage = {
      sender: 'user',
      text: messageText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Connect to the backend API
      const response = await fetch('/api/medical-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message: userMessage.text })
      });

      if (response.ok) {
        const data = await response.json();
        const botResponse = {
          sender: 'bot',
          text: data.response || 'I apologize, but I encountered an error processing your request. Please try again.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botResponse]);
      } else {
        throw new Error('Failed to get response from medical assistant');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        sender: 'bot',
        text: 'I apologize, but I\'m experiencing technical difficulties. Please try again later or contact support if the issue persists.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Modified to prevent default behavior completely for Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // This prevents the default action (adding a newline)
      if (!isLoading && !isInitializing && inputValue.trim() !== '') {
        handleSendMessage();
      }
      return false; // Prevent any bubbling
    }
  };
  
  // Improved scroll handling that won't cause layout shifts
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      // Access the container directly through ref
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };
  
  // Scroll to bottom when messages change with a slight delay to ensure content is rendered
  useEffect(() => {
    // Small timeout to ensure DOM is updated before scrolling
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 50);
    
    return () => clearTimeout(timeoutId);
  }, [messages]);
  
  // Initialize chatbot connection with backend
  useEffect(() => {
    // Check if the ML service is available
    const checkServiceHealth = async () => {
      try {
        const response = await fetch('/api/medical-chat/health', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        if (!data.success) {
          setMessages(prev => [
            ...prev, 
            {
              sender: 'bot',
              text: 'The medical chat service is currently unavailable. Your messages will be sent when the service is back online.',
              timestamp: new Date()
            }
          ]);
        }
      } catch (error) {
        console.error('Health check failed:', error);
        setMessages(prev => [
          ...prev, 
          {
            sender: 'bot',
            text: 'I\'m having trouble connecting to the medical service. Please check your internet connection or try again later.',
            timestamp: new Date()
          }
        ]);
      } finally {
        setIsInitializing(false);
      }
    };
    
    checkServiceHealth();
  }, []);



  const services = [
    {
      id: 'symptom-analyzer',
      title: 'Medical Chatbot',
      description: 'Get AI-powered analysis of your symptoms and health concerns',
      icon: 'Stethoscope',
      color: 'bg-blue-500',
      component: SymptomAnalyzer
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
        <title>Medical Chatbot - SmartClinicHub</title>
        <meta name="description" content="Intelligent medical chatbot providing healthcare guidance, symptom analysis, and medical information." />
        <meta name="keywords" content="medical chatbot, healthcare assistant, symptom analyzer, medical AI, health guidance" />
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
                  <Icon name="MessageCirclePlus" size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                    Medical Chatbot Assistant
                  </h1>
                  <p className="text-muted-foreground">
                    Intelligent health assistant to provide medical guidance and support
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
                      Welcome to your Medical Chatbot Assistant, {user?.firstName || 'there'}!
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Our AI-powered medical chatbot is designed to provide intelligent health insights and guidance. 
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
                        <span>AI-Powered Medical Assistant</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Chat Widget */}
            <div className="mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-border shadow-sm">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-primary/5 dark:bg-primary/10 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <Icon name="Stethoscope" size={20} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Medical Assistant</h3>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-muted-foreground">Online</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-[600px] flex flex-col p-4 bg-gray-50 dark:bg-gray-900" style={{ position: 'relative' }}>
                  {/* Messages container - embedded version of MedicalChatWidget */}
                  <div 
                    ref={messagesContainerRef}
                    className="flex-1 h-[420px] overflow-y-auto p-4 space-y-4 mb-4 border border-border rounded-lg bg-white dark:bg-gray-800" 
                    style={{ position: 'relative', maxHeight: '420px', minHeight: '420px' }}
                  >
                    {isInitializing ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-4 animate-pulse">
                          <Icon name="Bot" size={32} />
                        </div>
                        <p className="text-muted-foreground">Connecting to medical service...</p>
                        <div className="mt-4 flex space-x-2">
                          <div className="h-2.5 w-2.5 bg-primary/60 rounded-full animate-bounce"></div>
                          <div className="h-2.5 w-2.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <div className="h-2.5 w-2.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {messages.map((message, index) => (
                          <div key={index} className={`flex justify-${message.sender === 'user' ? 'end' : 'start'}`}>
                            <div className="flex items-start space-x-2 max-w-[85%]">
                              {message.sender === 'bot' && (
                                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                                  <Icon name="Bot" size={16} />
                                </div>
                              )}
                              <div className={`rounded-lg p-3 shadow-sm ${
                                message.sender === 'user' 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-gray-100 dark:bg-gray-700 text-foreground'
                              }`}>
                                <p className="text-sm whitespace-pre-wrap">
                                  {message.text}
                                </p>
                                <p className="text-xs mt-1 text-opacity-80">
                                  {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                </p>
                              </div>
                              {message.sender === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-primary/80 text-white flex items-center justify-center flex-shrink-0">
                                  <Icon name="User" size={16} />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {isLoading && (
                          <div className="flex justify-start">
                            <div className="flex items-start space-x-2">
                              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                                <Icon name="Bot" size={16} />
                              </div>
                              <div className="rounded-lg p-3 shadow-sm bg-gray-100 dark:bg-gray-700 text-foreground">
                                <div className="flex space-x-1 items-center">
                                  <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></div>
                                  <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                  <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Input area */}
                  <div className="p-2 mt-auto">
                    <div className="flex items-end space-x-2">
                      <div className="flex-1">
                        <textarea
                          placeholder={isInitializing ? "Connecting to medical service..." : "Ask a medical question..."}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground h-24"
                          rows="2"
                          value={inputValue}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyPress} /* Changed from onKeyPress to onKeyDown for better handling */
                          disabled={isLoading || isInitializing}
                          style={{ overflow: 'auto' }} /* Ensures scrollbar appears within textarea */
                        />
                      </div>
                      <Button
                        size="sm"
                        className="h-12 w-12 rounded-lg"
                        iconName={isInitializing ? "Loader2" : "Send"}
                        disabled={isLoading || inputValue.trim() === '' || isInitializing}
                        onClick={handleSendMessage}
                      />
                    </div>
                    
                    {/* Disclaimer */}
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      This AI assistant provides general information only. Always consult healthcare professionals for medical advice.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Services */}
            <h2 className="text-xl font-semibold mb-4">Additional Health Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                      View Details
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
                <div className="text-2xl font-bold text-blue-600 mb-1">2</div>
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