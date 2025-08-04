import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing chat widget functionality
 * Handles session management, messaging, real-time updates, and typing indicators
 */
export const useWidgetChat = (apiUrl = '/api/widget', widgetName = 'default') => {
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [typingIndicators, setTypingIndicators] = useState([]);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(null);

  const typingTimeoutRef = useRef(null);
  const sessionTokenRef = useRef(null);

  // Load widget settings on mount
  useEffect(() => {
    loadWidgetSettings();
  }, [widgetName]);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('widget_session');
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        if (parsedSession.sessionToken) {
          sessionTokenRef.current = parsedSession.sessionToken;
          validateSession(parsedSession.sessionToken);
        }
      } catch (error) {
        console.error('Error parsing saved session:', error);
        localStorage.removeItem('widget_session');
      }
    }
  }, []);

  // Load widget settings
  const loadWidgetSettings = async () => {
    try {
      const response = await fetch(`${apiUrl}/settings?name=${widgetName}`);
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
        setIsConnected(true);
      } else {
        throw new Error(data.error || 'Failed to load settings');
      }
    } catch (error) {
      console.error('Error loading widget settings:', error);
      setError('Failed to load chat settings');
      setIsConnected(false);
    }
  };

  // Validate existing session
  const validateSession = async (sessionToken) => {
    try {
      const response = await fetch(`${apiUrl}/session?sessionToken=${sessionToken}`);
      const data = await response.json();
      
      if (data.success && data.session.isActive) {
        setSession(data.session);
        sessionTokenRef.current = sessionToken;
        loadMessages(sessionToken);
      } else {
        // Session expired or invalid
        localStorage.removeItem('widget_session');
        sessionTokenRef.current = null;
        setSession(null);
      }
    } catch (error) {
      console.error('Error validating session:', error);
      localStorage.removeItem('widget_session');
      sessionTokenRef.current = null;
      setSession(null);
    }
  };

  // Start new session
  const startSession = async (customerData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      const data = await response.json();

      if (data.success) {
        setSession(data.session);
        sessionTokenRef.current = data.session.sessionToken;
        
        // Save session to localStorage
        localStorage.setItem('widget_session', JSON.stringify({
          sessionToken: data.session.sessionToken,
          customerId: data.customer.id,
          customerEmail: data.customer.email
        }));

        // Send initial message if provided
        if (customerData.metadata?.initialMessage) {
          await sendMessage(customerData.metadata.initialMessage);
        }

        return data;
      } else {
        throw new Error(data.error || 'Failed to start session');
      }
    } catch (error) {
      console.error('Error starting session:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // End session
  const endSession = async (customerSatisfaction = null) => {
    if (!sessionTokenRef.current) return;

    try {
      await fetch(`${apiUrl}/session`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken: sessionTokenRef.current,
          action: 'end',
          customerSatisfaction
        }),
      });

      // Clear local state
      setSession(null);
      setMessages([]);
      sessionTokenRef.current = null;
      localStorage.removeItem('widget_session');
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  // Load messages
  const loadMessages = async (sessionToken) => {
    try {
      const response = await fetch(`${apiUrl}/messages?sessionToken=${sessionToken}&limit=50`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.messages);
      } else {
        throw new Error(data.error || 'Failed to load messages');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load conversation history');
    }
  };

  // Load typing indicators
  const loadTypingIndicators = async (sessionToken) => {
    try {
      const response = await fetch(`${apiUrl}/typing?sessionToken=${sessionToken}`);
      const data = await response.json();

      if (data.success) {
        const indicators = data.typingIndicators || [];
        setTypingIndicators(indicators);
      } else {
        setTypingIndicators([]);
      }
    } catch (error) {
      console.error('Error loading typing indicators:', error);
      setTypingIndicators([]);
    }
  };

  // Send message
  const sendMessage = async (content) => {
    if (!sessionTokenRef.current || !content.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken: sessionTokenRef.current,
          message: content.trim(),
          messageType: 'TEXT'
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Add new messages to the list
        setMessages(prev => [...prev, ...data.messages]);
        
        // Update session activity
        updateSessionActivity();
        
        return data.messages;
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Set typing indicator
  const setTyping = useCallback(async (isTyping) => {
    if (!sessionTokenRef.current) return;

    try {
      const response = await fetch(`${apiUrl}/typing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken: sessionTokenRef.current,
          isTyping
        }),
      });

      const data = await response.json();

      // Clear typing timeout if stopping typing
      if (!isTyping && typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // Immediately refresh typing indicators
      if (sessionTokenRef.current) {
        setTimeout(() => {
          loadTypingIndicators(sessionTokenRef.current);
        }, 100); // Small delay to ensure DB is updated
      }
    } catch (error) {
      console.error('Error setting typing indicator:', error);
    }
  }, [apiUrl]);

  // Update session activity
  const updateSessionActivity = async () => {
    if (!sessionTokenRef.current) return;

    try {
      await fetch(`${apiUrl}/session`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken: sessionTokenRef.current,
          action: 'update_activity'
        }),
      });
    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (messageIds = null) => {
    if (!sessionTokenRef.current) return;

    try {
      await fetch(`${apiUrl}/messages`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken: sessionTokenRef.current,
          messageIds
        }),
      });

      // Update local message state
      setMessages(prev => prev.map(msg => ({
        ...msg,
        isRead: messageIds ? messageIds.includes(msg.id) ? true : msg.isRead : true
      })));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Periodic session activity update and typing indicators refresh
  useEffect(() => {
    if (!session || !sessionTokenRef.current) return;

    const interval = setInterval(() => {
      updateSessionActivity();
      loadTypingIndicators(sessionTokenRef.current);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [session]);

  // Load typing indicators when session starts
  useEffect(() => {
    if (session && sessionTokenRef.current) {
      loadTypingIndicators(sessionTokenRef.current);
    }
  }, [session]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    session,
    messages,
    isLoading,
    isConnected,
    typingIndicators,
    settings,
    error,
    sendMessage,
    startSession,
    endSession,
    setTyping,
    markMessagesAsRead,
    loadMessages: () => loadMessages(sessionTokenRef.current),
    updateSessionActivity
  };
};
