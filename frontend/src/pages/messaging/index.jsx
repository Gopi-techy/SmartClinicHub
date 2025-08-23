import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import RoleBasedHeader from '../../components/ui/RoleBasedHeader';
import PatientBottomTabs from '../../components/ui/PatientBottomTabs';
import PatientSidebar from '../../components/ui/PatientSidebar';
import ProviderSidebar from '../../components/ui/ProviderSidebar';
import ConversationsList from '../../components/messaging/ConversationsList';
import ChatInterface from '../../components/messaging/ChatInterface';
import NewChatModal from '../../components/messaging/NewChatModal';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';

const MessagingPage = () => {
  const navigate = useNavigate();
  const { user, userProfile, loading } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!loading && (!user || !userProfile)) {
      navigate('/login-registration');
      return;
    }
  }, [user, userProfile, loading, navigate]);

  // Handle responsive view
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  // Handle conversation selection
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    if (isMobileView) {
      setShowChatOnMobile(true);
    }
  };

  // Handle new chat creation
  const handleChatCreated = (conversation) => {
    setSelectedConversation(conversation);
    setShowNewChatModal(false);
    if (isMobileView) {
      setShowChatOnMobile(true);
    }
  };

  // Handle back to conversations on mobile
  const handleBackToConversations = () => {
    setShowChatOnMobile(false);
    setSelectedConversation(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Icon name="Loader" className="animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  const isPatient = userProfile?.role === 'patient';
  const isDoctor = userProfile?.role === 'doctor';

  return (
    <>
      <Helmet>
        <title>Messages - SmartClinicHub</title>
        <meta name="description" content="Secure messaging between patients and doctors on SmartClinicHub platform." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <RoleBasedHeader />
        {isPatient && <PatientBottomTabs />}
        {isPatient && <PatientSidebar />}
        {isDoctor && <ProviderSidebar />}

        {/* Main Content */}
        <div className={`pt-16 ${isPatient ? 'pb-20 md:pb-8 md:ml-64' : 'md:ml-80'}`}>
          <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]">
            {/* Desktop Layout */}
            <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 h-full">
              {/* Conversations Sidebar */}
              <div className="border-r border-border">
                <ConversationsList
                  onSelectConversation={handleSelectConversation}
                  selectedConversationId={selectedConversation?.id}
                  onStartNewChat={isPatient ? () => setShowNewChatModal(true) : undefined}
                />
              </div>

              {/* Chat Area */}
              <div className="md:col-span-2 lg:col-span-3">
                {selectedConversation ? (
                  <ChatInterface conversationId={selectedConversation.id} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Icon name="MessageCircle" className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        {userProfile?.role === 'patient' ? 'Start a conversation' : 'Select a conversation'}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {userProfile?.role === 'patient' ?'Connect with your healthcare providers securely' :'Choose a conversation from the sidebar to view messages'
                        }
                      </p>
                      {isPatient && (
                        <Button
                          iconName="MessageCirclePlus"
                          onClick={() => setShowNewChatModal(true)}
                        >
                          New Conversation
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden h-full">
              {!showChatOnMobile ? (
                // Conversations List View
                <ConversationsList
                  onSelectConversation={handleSelectConversation}
                  selectedConversationId={selectedConversation?.id}
                  onStartNewChat={isPatient ? () => setShowNewChatModal(true) : undefined}
                />
              ) : (
                // Chat View
                <div className="h-full flex flex-col">
                  <div className="flex items-center p-4 border-b border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="ArrowLeft"
                      onClick={handleBackToConversations}
                      className="mr-2"
                    />
                    <h2 className="font-medium text-foreground">Back to Messages</h2>
                  </div>
                  <div className="flex-1">
                    {selectedConversation && (
                      <ChatInterface conversationId={selectedConversation.id} />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* New Chat Modal */}
        <NewChatModal
          isOpen={showNewChatModal}
          onClose={() => setShowNewChatModal(false)}
          onChatCreated={handleChatCreated}
        />
      </div>
    </>
  );
};

export default MessagingPage;