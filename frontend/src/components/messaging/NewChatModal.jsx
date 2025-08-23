import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import messagingService from '../../utils/messagingService';
import Button from '../ui/Button';
import Icon from '../AppIcon';

const NewChatModal = ({ isOpen, onClose, onChatCreated }) => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [subject, setSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Load available doctors
  useEffect(() => {
    if (!isOpen) return;

    const loadDoctors = async () => {
      setLoading(true);
      const result = await messagingService.getAvailableDoctors();
      if (result?.success) {
        setDoctors(result.data || []);
      }
      setLoading(false);
    };

    loadDoctors();
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedDoctor(null);
      setSubject('');
      setInitialMessage('');
      setCreating(false);
    }
  }, [isOpen]);

  // Handle creating the conversation
  const handleCreateChat = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !initialMessage.trim() || creating) return;

    setCreating(true);

    try {
      // Create conversation
      const conversationResult = await messagingService.createConversation(
        user.id,
        selectedDoctor.id,
        subject || 'General Consultation'
      );

      if (!conversationResult?.success) {
        alert(conversationResult?.error || 'Failed to create conversation');
        setCreating(false);
        return;
      }

      // Send initial message
      const messageResult = await messagingService.sendMessage(
        conversationResult.data.id,
        initialMessage.trim()
      );

      if (!messageResult?.success) {
        alert(messageResult?.error || 'Failed to send message');
        setCreating(false);
        return;
      }

      // Success - close modal and notify parent
      onChatCreated?.(conversationResult.data);
      onClose?.();

    } catch (error) {
      console.log('Error creating chat:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Start New Conversation</h2>
          <Button
            variant="ghost"
            size="sm"
            iconName="X"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          />
        </div>

        {/* Content */}
        <form onSubmit={handleCreateChat} className="p-6 space-y-4">
          {/* Doctor Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Doctor
            </label>
            {loading ? (
              <div className="flex items-center space-x-2 p-3 border border-input rounded-lg">
                <Icon name="Loader" className="animate-spin w-4 h-4" />
                <span className="text-sm text-muted-foreground">Loading doctors...</span>
              </div>
            ) : doctors.length === 0 ? (
              <div className="p-3 border border-input rounded-lg text-sm text-muted-foreground">
                No doctors available
              </div>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto border border-input rounded-lg">
                {doctors.map((doctor) => (
                  <button
                    key={doctor.id}
                    type="button"
                    onClick={() => setSelectedDoctor(doctor)}
                    className={`w-full text-left p-3 hover:bg-muted/50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      selectedDoctor?.id === doctor.id ? 'bg-muted border-l-2 border-l-primary' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        {doctor.avatar_url ? (
                          <img 
                            src={doctor.avatar_url} 
                            alt={doctor.full_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <Icon name="Stethoscope" className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          {doctor.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doctor.email}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Subject (Optional)
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., General Consultation, Lab Results"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Initial Message */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Message <span className="text-destructive">*</span>
            </label>
            <textarea
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="Type your message to start the conversation..."
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedDoctor || !initialMessage.trim() || creating}
              iconName={creating ? "Loader" : "Send"}
              iconPosition="left"
            >
              {creating ? 'Creating...' : 'Start Conversation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewChatModal;