import React, { useState } from 'react';
import MedicalChatButton from './MedicalChatButton';
import MedicalChatWidget from './MedicalChatWidget';

const MedicalChatContainer = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleToggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen) {
      setUnreadCount(0); // Clear unread count when opening chat
    }
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  return (
    <>
      <MedicalChatButton
        onClick={handleToggleChat}
        isActive={isChatOpen}
        unreadCount={unreadCount}
      />
      <MedicalChatWidget
        isOpen={isChatOpen}
        onClose={handleCloseChat}
      />
    </>
  );
};

export default MedicalChatContainer;