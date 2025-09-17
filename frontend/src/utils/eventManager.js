// Real-time event manager for SmartClinicHub
class EventManager {
  constructor() {
    this.listeners = new Map();
    this.pollingInterval = null;
    this.processedEvents = new Set();
    
    // Listen for localStorage changes (cross-tab communication)
    window.addEventListener('storage', this.handleStorageChange.bind(this));
    
    // Listen for window focus events for immediate updates
    window.addEventListener('focus', () => {
      console.log('👁️ Window focused, checking for events...');
      this.checkForPendingEvents();
    });
    
    // Start polling fallback immediately
    setTimeout(() => {
      this.startPollingFallback();
    }, 500); // Start quickly
  }

  // Handle localStorage changes from other tabs
  handleStorageChange(event) {
    console.log('🔍 Storage change detected:', event.key, event.newValue ? 'has data' : 'no data');
    
    if (event.key && event.key.startsWith('event_')) {
      // Extract event name properly (remove timestamp part)
      const keyParts = event.key.split('_');
      if (keyParts.length >= 3) { // event_timestamp_eventName
        const eventName = keyParts.slice(2).join('_'); // Handle event names with underscores
        
        if (event.newValue) {
          try {
            const data = JSON.parse(event.newValue);
            console.log(`📨 Cross-tab event received: ${eventName}`, data);
            
            // Check if this event is from another tab (not self-triggered)
            const currentTabId = this.getTabId();
            if (data.tabId !== currentTabId) {
              console.log('🌐 Processing cross-tab event from different tab');
              
              // Trigger window event for local listeners
              window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
            } else {
              console.log('🚫 Ignoring self-triggered event');
            }
            
          } catch (error) {
            console.error('❌ Error parsing cross-tab event:', error);
          }
        }
      }
    }
  }

  // Polling-based fallback for cross-tab communication
  startPollingFallback() {
    if (this.pollingInterval) return; // Already started
    
    console.log('🔄 Starting polling fallback for cross-tab events...');
    this.processedEvents = new Set();
    
    this.pollingInterval = setInterval(() => {
      // Check for new events in localStorage
      const keys = Object.keys(localStorage);
      const eventKeys = keys.filter(key => key.startsWith('event_'));
      
      eventKeys.forEach(key => {
        if (!this.processedEvents.has(key)) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const eventData = JSON.parse(data);
              const keyParts = key.split('_');
              if (keyParts.length >= 3) {
                const eventName = keyParts.slice(2).join('_');
                const currentTabId = this.getTabId();
                
                if (eventData.tabId !== currentTabId) {
                  console.log(`⚡ Fast polling detected cross-tab event: ${eventName}`, eventData);
                  window.dispatchEvent(new CustomEvent(eventName, { detail: eventData }));
                }
                
                this.processedEvents.add(key);
              }
            } catch (error) {
              console.error('❌ Error processing polled event:', error);
            }
          }
        }
      });
      
      // Clean up old processed events from memory
      if (this.processedEvents.size > 100) {
        const oldEvents = Array.from(this.processedEvents).slice(0, 50);
        oldEvents.forEach(event => this.processedEvents.delete(event));
      }
    }, 200); // Check every 200ms for near-instant updates
  }

  // Get or create a unique tab ID
  getTabId() {
    if (!this.tabId) {
      this.tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.tabId;
  }

  // Subscribe to an event
  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventName);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Emit an event
  emit(eventName, data) {
    console.log(`📡 Event emitted: ${eventName}`, data);
    
    // Emit through window events (for same-tab communication)
    window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    
    // Emit through localStorage (for cross-tab communication)
    const timestamp = Date.now();
    const eventKey = `event_${timestamp}_${eventName}`;
    const eventData = {
      ...data,
      timestamp,
      tabId: this.getTabId() // Use consistent tab ID
    };
    
    console.log(`📦 Storing cross-tab event: ${eventKey}`, eventData);
    localStorage.setItem(eventKey, JSON.stringify(eventData));
    
    // Trigger immediate check in other tabs (force faster polling)
    this.triggerImmediateCheck();
    
    // Clean up after other tabs have had time to process
    setTimeout(() => {
      const currentValue = localStorage.getItem(eventKey);
      if (currentValue) {
        console.log(`🧹 Cleaning up event: ${eventKey}`);
        localStorage.removeItem(eventKey);
      }
    }, 2000); // Faster cleanup with more frequent polling
    
    // Emit through internal listeners
    const callbacks = this.listeners.get(eventName);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${eventName}:`, error);
        }
      });
    }
  }

  // Trigger immediate polling check
  triggerImmediateCheck() {
    // Store a special "check now" flag
    localStorage.setItem('event_check_trigger', Date.now().toString());
    
    // Clean up the trigger after a short delay
    setTimeout(() => {
      localStorage.removeItem('event_check_trigger');
    }, 100);
  }

  // Check for pending events immediately
  checkForPendingEvents() {
    const keys = Object.keys(localStorage);
    const eventKeys = keys.filter(key => key.startsWith('event_') && !key.includes('check_trigger'));
    
    eventKeys.forEach(key => {
      if (!this.processedEvents.has(key)) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const eventData = JSON.parse(data);
            const keyParts = key.split('_');
            if (keyParts.length >= 3) {
              const eventName = keyParts.slice(2).join('_');
              const currentTabId = this.getTabId();
              
              if (eventData.tabId !== currentTabId) {
                console.log(`⚡ Immediate check detected cross-tab event: ${eventName}`, eventData);
                window.dispatchEvent(new CustomEvent(eventName, { detail: eventData }));
              }
              
              this.processedEvents.add(key);
            }
          } catch (error) {
            console.error('❌ Error processing immediate event:', error);
          }
        }
      }
    });
  }

  // Remove all listeners for an event
  off(eventName) {
    this.listeners.delete(eventName);
  }

  // Remove all listeners
  clear() {
    this.listeners.clear();
  }
}

// Create a singleton instance
const eventManager = new EventManager();

// Test cross-tab communication (for debugging)
if (typeof window !== 'undefined') {
  window.testCrossTabEvent = () => {
    console.log('🧪 Testing cross-tab event...');
    eventManager.emit('testEvent', { 
      message: 'Hello from another tab!', 
      time: new Date().toISOString() 
    });
  };
  
  // Listen for test events
  window.addEventListener('testEvent', (event) => {
    console.log('✅ Test event received:', event.detail);
  });

  // Debug localStorage events
  window.addEventListener('storage', (e) => {
    console.log('🔍 Raw storage event detected:', {
      key: e.key,
      newValue: e.newValue ? 'has data' : 'no data',
      oldValue: e.oldValue ? 'had data' : 'no data'
    });
  });
}

// Export specific event functions for common use cases
export const emitVerificationUpdate = (doctorData, status, message, rejectionReason = null) => {
  eventManager.emit('verificationStatusUpdate', {
    doctorId: doctorData._id || doctorData.id,
    doctorEmail: doctorData.email,
    doctorName: `${doctorData.firstName} ${doctorData.lastName}`,
    status,
    message,
    rejectionReason,
    timestamp: new Date().toISOString()
  });
};

export const emitNewDoctorRegistration = (doctorData) => {
  eventManager.emit('newDoctorRegistration', {
    doctorId: doctorData.id,
    doctorEmail: doctorData.email,
    doctorName: `${doctorData.firstName} ${doctorData.lastName}`,
    role: doctorData.role,
    registrationTime: new Date().toISOString()
  });
};

export const emitProfileUpdate = (userData) => {
  eventManager.emit('profileUpdate', {
    userId: userData.id,
    userEmail: userData.email,
    userName: `${userData.firstName} ${userData.lastName}`,
    role: userData.role,
    updateTime: new Date().toISOString()
  });
};

export default eventManager;