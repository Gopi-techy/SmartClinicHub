import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import messagingService from '../../utils/messagingService';
import Button from '../ui/Button';
import Icon from '../AppIcon';

const ConversationsList = ({ onSelectConversation, selectedConversationId, onStartNewChat }) => {
  const { user, userProfile } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Load conversations
  useEffect(() => {
    if (!user?.id) return;

    const loadConversations = async () => {
      setLoading(true);
      const result = await messagingService.getConversations(user.id);
      if (result?.success) {
        setConversations(result.data || []);
      }
      setLoading(false);
    };

    loadConversations();

    // Subscribe to conversation updates
    const subscription = messagingService.subscribeToConversations(
      user.id,
      ({ type, conversation }) => {
        if (type === 'conversation_updated') {
          setConversations(prev => 
            prev.map(conv => 
              conv.id === conversation.id ? { ...conv, ...conversation } : conv
            )
          );
        }
      }
    );

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [user?.id]);

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    
    const partner = userProfile?.role === 'patient' 
      ? conversation.doctor 
      : conversation.patient;
    
    return partner?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conversation.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conversation.last_message?.content?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Format conversation time
  const formatConversationTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Icon name="Loader" className="animate-spin" />
          <span>Loading conversations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Messages</h2>
          {userProfile?.role === 'patient' && onStartNewChat && (
            <Button
              variant="outline"
              size="sm"
              iconName="MessageCirclePlus"
              onClick={onStartNewChat}
            />
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Icon 
            name="Search" 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Icon name="MessageCircle" className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            {searchQuery ? (
              <p className="text-muted-foreground">No conversations match your search</p>
            ) : (
              <>
                <p className="text-muted-foreground mb-2">No conversations yet</p>
                {userProfile?.role === 'patient' && onStartNewChat && (
                  <Button
                    variant="outline"
                    iconName="MessageCirclePlus"
                    onClick={onStartNewChat}
                  >
                    Start your first conversation
                  </Button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredConversations.map((conversation) => {
              const partner = userProfile?.role === 'patient' 
                ? conversation.doctor 
                : conversation.patient;
              
              const isSelected = selectedConversationId === conversation.id;
              const hasUnreadMessages = conversation.unread_count > 0;

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation?.(conversation)}
                  className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                    isSelected ? 'bg-muted border-r-2 border-r-primary' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      {partner?.avatar_url ? (
                        <img 
                          src={partner.avatar_url} 
                          alt={partner.full_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <Icon name="User" className="w-5 h-5 text-primary" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-medium text-sm truncate ${
                          hasUnreadMessages ? 'text-foreground' : 'text-foreground/80'
                        }`}>
                          {partner?.full_name || 'Unknown User'}
                        </h3>
                        <div className="flex items-center space-x-2 shrink-0">
                          {conversation.last_message_at && (
                            <span className={`text-xs ${
                              hasUnreadMessages ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                              {formatConversationTime(conversation.last_message_at)}
                            </span>
                          )}
                          {hasUnreadMessages && (
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          )}
                        </div>
                      </div>

                      <p className={`text-sm truncate ${
                        hasUnreadMessages ? 'text-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {conversation.last_message?.content || conversation.subject || 'No messages yet'}
                      </p>

                      {hasUnreadMessages && conversation.unread_count > 0 && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                            {conversation.unread_count}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationsList;