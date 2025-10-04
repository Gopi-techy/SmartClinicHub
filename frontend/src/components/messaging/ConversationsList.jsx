import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, User, UserPlus, Stethoscope } from 'lucide-react';
import messagingService from '../../services/messagingService';
import Icon from '../AppIcon';

const ConversationsList = ({ 
  conversations = [], 
  selectedConversation, 
  onSelectConversation, 
  currentUser,
  onlineUsers = [],
  loading = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [contactsList, setContactsList] = useState([]); // Generic list for doctors or patients
  const [contactsLoading, setContactsLoading] = useState(false);
  const [showContactsList, setShowContactsList] = useState(false);
  
  // Determine user role and what contacts to fetch
  const isDoctor = currentUser?.role === 'doctor';
  const isPatient = currentUser?.role === 'patient';
  const contactType = isDoctor ? 'patients' : 'doctors';
  const contactLabel = isDoctor ? 'Available Patients' : 'Available Doctors';
  
  // Fetch contacts (doctors for patients, patients for doctors) when there are no conversations
  useEffect(() => {
    const fetchContacts = async () => {
      // Only fetch contacts if there are no conversations or user wants to see all contacts
      if (conversations.length === 0 || showContactsList) {
        setContactsLoading(true);
        
        let result;
        if (isDoctor) {
          result = await messagingService.getAllPatients();
          console.log('🏥 Doctor fetching patients result:', result);
          if (result.success) {
            console.log('👥 Setting patients list:', result.patients);
            setContactsList(result.patients);
          }
        } else {
          result = await messagingService.getAllDoctors();
          if (result.success) {
            setContactsList(result.doctors);
          }
        }
        
        setContactsLoading(false);
      }
    };
    
    fetchContacts();
  }, [conversations.length, showContactsList, isDoctor]);

  // Function to start a new conversation with a contact (doctor or patient)
  const handleStartConversation = async (contact) => {
    try {
      console.log(`🔄 Starting conversation with ${contactType.slice(0, -1)}:`, contact);
      
      // Validate contact data
      if (!contact || !contact._id) {
        console.error('❌ Invalid contact data:', contact);
        return;
      }

      // Check if contact._id is a valid format (MongoDB ObjectId should be 24 characters)
      if (typeof contact._id !== 'string' || contact._id.length !== 24) {
        console.error('❌ Invalid contact ID format:', contact._id);
        return;
      }

      // Format contact data in the same structure as conversation.participant
      const contactAsParticipant = {
        _id: contact._id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        profilePicture: contact.profilePicture,
        role: isDoctor ? 'patient' : 'doctor',
        specialization: contact.professionalInfo?.specialization || (isDoctor ? 'Patient' : 'Doctor'),
        isNew: true // Mark as new conversation
      };
      
      console.log('✅ Contact participant created:', contactAsParticipant);
      
      // Create temporary conversation object
      const tempConversation = {
        participant: contactAsParticipant,
        lastMessage: null,
        unreadCount: 0
      };
      
      // Select this temporary conversation immediately
      onSelectConversation(tempConversation);
      
      console.log('✅ Temporary conversation selected');
      
    } catch (error) {
      console.error('❌ Failed to start conversation:', error);
    }
  };

  // Toggle between conversations and contacts list
  const toggleContactsList = () => {
    setShowContactsList(!showContactsList);
  };

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conversation => {
    const participant = conversation.participant;
    const fullName = `${participant.firstName} ${participant.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  // Filter contacts based on search term
  const filteredContacts = contactsList.filter(contact => {
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  // Format last message time
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Check if user is online
  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  // Truncate message content
  const truncateMessage = (content, maxLength = 50) => {
    if (!content) return 'No messages yet';
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  if (loading) {
    return (
      <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span>Loading conversations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
          {conversations.length > 0 && (
            <button
              onClick={toggleContactsList}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              {showContactsList ? 'Show Conversations' : `Show All ${contactType.charAt(0).toUpperCase() + contactType.slice(1)}`}
              {!showContactsList && (
                <UserPlus className="ml-1 h-4 w-4" />
              )}
            </button>
          )}
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder={showContactsList || conversations.length === 0 ? `Search ${contactType}...` : "Search conversations..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversations/Contacts List */}
      <div className="flex-1 overflow-y-auto">
        {/* Show contacts list if no conversations or if contacts list view is selected */}
        {(conversations.length === 0 || showContactsList) ? (
          contactsLoading ? (
            <div className="text-center py-8 px-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-500">Loading {contactType}...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Icon name="UserX" className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No {contactType} found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchTerm ? `No results for "${searchTerm}"` : `There are no available ${contactType}`}
              </p>
            </div>
          ) : (
            <>
              {/* Section title */}
              <div className="px-4 py-2 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-500">{contactLabel}</h3>
              </div>
              
              {/* Contacts list */}
              {filteredContacts.map((contact) => (
                <div
                  key={contact._id}
                  onClick={() => handleStartConversation(contact)}
                  className="flex items-center p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100"
                >
                  <div className="flex-shrink-0 mr-3 relative">
                    {contact.profilePicture ? (
                      <img
                        src={contact.profilePicture}
                        alt={`${isDoctor ? '' : 'Dr. '}${contact.firstName} ${contact.lastName}`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Icon name={isDoctor ? "User" : "Stethoscope"} className="w-6 h-6 text-blue-500" />
                      </div>
                    )}
                    {onlineUsers.includes(contact._id) && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {isDoctor ? 
                          `${contact.firstName || contact.patient?.firstName || 'Unknown'} ${contact.lastName || contact.patient?.lastName || 'Patient'}` : 
                          `Dr. ${contact.firstName || 'Unknown'} ${contact.lastName || 'Doctor'}`
                        }
                      </h3>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500">
                        {isDoctor ? "Patient" : (contact.professionalInfo?.specialization || "Doctor")}
                      </span>
                      {onlineUsers.includes(contact._id) && (
                        <span className="text-xs text-green-500 ml-2">• Online</span>
                      )}
                    </div>
                    
                    <div className="mt-1 flex items-center text-xs text-blue-600">
                      <Icon name="MessageSquarePlus" className="w-3 h-3 mr-1" />
                      <span>Start conversation</span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No conversations match your search</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchTerm ? `No results for "${searchTerm}"` : 'Try searching with a different term'}
            </p>
          </div>
        ) : (
          // Regular conversations list
          filteredConversations.map((conversation) => {
            const participant = conversation.participant;
            const isSelected = selectedConversation?.participant._id === participant._id;
            const isOnline = isUserOnline(participant._id);
            
            return (
              <div
                key={participant._id}
                onClick={() => onSelectConversation(conversation)}
                className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                  isSelected ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex-shrink-0 mr-3 relative">
                  <img
                    src={participant.profilePicture || '/assets/images/no_image.png'}
                    alt={`${participant.firstName} ${participant.lastName}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {participant.firstName} {participant.lastName}
                    </h3>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {conversation.lastMessage?.createdAt && 
                        formatMessageTime(conversation.lastMessage.createdAt)
                      }
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">
                      {truncateMessage(conversation.lastMessage?.content)}
                    </p>
                    
                    {conversation.unreadCount > 0 && (
                      <div className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 ml-2 flex-shrink-0 min-w-5 text-center">
                        {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-gray-400 capitalize">
                      {participant.role}
                    </span>
                    {isOnline && (
                      <span className="text-xs text-green-500 ml-2">• Online</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationsList;