import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/authContext';
import { getAccessToken } from '@/lib/auth-storage';

// Initialize Supabase client for real-time features
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });
  console.log('Supabase client initialized for real-time messages:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey
  });
} else {
  console.warn('Supabase credentials missing:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    url: supabaseUrl
  });
}

/**
 * Custom hook for fetching and managing messages with real-time updates
 */
export const useMessages = (conversationId, options = {}) => {
  const {
    limit = 50,
    useRealtime = true,
    autoMarkAsRead = true
  } = options;

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const subscriptionRef = useRef(null);
  const { isAuthenticated } = useAuth();

  // Get headers for authenticated requests
  const getHeaders = useCallback(() => {
    const headers = {
      'Content-Type': 'application/json',
    };

    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }, []);

  // Fetch messages from API
  const fetchMessages = useCallback(async (offset = 0, append = false) => {
    if (!conversationId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    try {
      if (!append) {
        setIsLoading(true);
      }
      setError(null);

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });

      // Try agent API first if authenticated, then fall back to conversations API
      let response, data;
      const token = getAccessToken();

      if (token && isAuthenticated) {
        try {
          response = await fetch(`/api/agent/chats/${conversationId}/messages?${params}`, {
            headers: getHeaders()
          });
          data = await response.json();

          // If agent API fails with auth error, fall back to conversations API
          if (!response.ok && response.status === 401) {
            throw new Error('Agent API authentication failed');
          }
        } catch (agentError) {
          console.log('Agent API failed, falling back to conversations API:', agentError.message);
          // Fall back to conversations API
          response = await fetch(`/api/conversations/${conversationId}/messages?${params}`);
          data = await response.json();
        }
      } else {
        // Not authenticated, use conversations API directly
        response = await fetch(`/api/conversations/${conversationId}/messages?${params}`);
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch messages');
      }

      if (append) {
        setMessages(prev => [...data.messages, ...prev]);
      } else {
        setMessages(data.messages || []);
      }

      setHasMore(data.hasMore || false);

      // Auto-mark messages as read if enabled
      if (autoMarkAsRead && data.messages?.length > 0) {
        markMessagesAsRead(data.messages.map(m => m.id));
      }

    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err.message);
      
      // Fallback to sample messages for development
      if (conversationId) {
        setMessages([
          {
            id: 'sample-1',
            content: 'Hello! How can I help you today?',
            senderType: 'AGENT',
            isFromAI: false,
            createdAt: new Date(Date.now() - 30 * 60 * 1000),
            user: { name: 'Agent', profileImage: null }
          },
          {
            id: 'sample-2',
            content: 'I need help with my account setup.',
            senderType: 'CUSTOMER',
            createdAt: new Date(Date.now() - 25 * 60 * 1000),
            user: { name: 'Customer' }
          },
          {
            id: 'sample-3',
            content: 'I can help you with that! Let me check your account details.',
            senderType: 'AGENT',
            isFromAI: false,
            createdAt: new Date(Date.now() - 20 * 60 * 1000),
            user: { name: 'Agent', profileImage: null }
          }
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, limit, autoMarkAsRead, getHeaders, isAuthenticated]);

  // Load more messages (pagination)
  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      fetchMessages(messages.length, true);
    }
  }, [fetchMessages, messages.length, hasMore, isLoading]);

  // Refresh messages
  const refresh = useCallback(() => {
    fetchMessages(0, false);
  }, [fetchMessages]);

  // Send a new message
  const sendMessage = useCallback(async (content, messageType = 'TEXT') => {
    if (!conversationId || !content.trim()) return null;

    try {
      // Try agent API first if authenticated, then fall back to conversations API
      let response, data;
      const token = getAccessToken();

      if (token && isAuthenticated) {
        try {
          response = await fetch(`/api/agent/chats/${conversationId}/messages`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
              content: content.trim(),
              messageType
            })
          });
          data = await response.json();

          // If agent API fails with auth error, fall back to conversations API
          if (!response.ok && response.status === 401) {
            throw new Error('Agent API authentication failed');
          }
        } catch (agentError) {
          console.log('Agent API failed, falling back to conversations API:', agentError.message);
          // Fall back to conversations API
          response = await fetch(`/api/conversations/${conversationId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: content.trim(),
              messageType,
              senderType: 'AGENT'
            })
          });
          data = await response.json();
        }
      } else {
        // Not authenticated, use conversations API directly
        response = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: content.trim(),
            messageType,
            senderType: 'AGENT'
          })
        });
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Optimistically add the message to the list
      const newMessage = {
        id: data.messageId || `temp-${Date.now()}`,
        content: content.trim(),
        senderType: 'AGENT',
        messageType,
        createdAt: new Date(),
        user: { name: 'You' },
        status: 'sending'
      };

      setMessages(prev => [...prev, newMessage]);

      return data.messageId;
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  }, [conversationId, getHeaders, isAuthenticated]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (messageIds) => {
    if (!conversationId || !messageIds?.length) return;

    try {
      await fetch(`/api/conversations/${conversationId}/messages/read`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ messageIds })
      });

      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          messageIds.includes(msg.id) 
            ? { ...msg, readAt: new Date(), status: 'read' }
            : msg
        )
      );
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [conversationId, getHeaders, isAuthenticated]);

  // Set up real-time subscription for messages
  const setupRealtimeSubscription = useCallback(() => {
    if (!supabase || !useRealtime || !conversationId) {
      console.log('Real-time subscription skipped:', {
        hasSupabase: !!supabase,
        useRealtime,
        conversationId
      });
      return;
    }

    console.log('Setting up real-time subscription for conversation:', conversationId);

    // Unsubscribe from previous subscription
    if (subscriptionRef.current) {
      console.log('Unsubscribing from previous subscription');
      subscriptionRef.current.unsubscribe();
    }

    // Subscribe to message broadcasts for this conversation
    const subscription = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'broadcast',
        { event: 'new_message' },
        (payload) => {
          console.log('New message broadcast received:', payload);
          if (payload.payload.chatId === conversationId) {
            handleNewMessage(payload.payload);
          }
        }
      )
      .on(
        'broadcast',
        { event: 'message_updated' },
        (payload) => {
          console.log('Message update broadcast received:', payload);
          if (payload.payload.chatId === conversationId) {
            handleMessageUpdate(payload.payload);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Subscription status:', status, err);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to real-time messages for chat:', conversationId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Failed to subscribe to real-time messages:', status, err);
        } else if (status === 'CLOSED') {
          console.warn('⚠️ Real-time subscription closed:', status, err);
        } else {
          console.log('📡 Real-time subscription status:', status, err);
        }
      });

    subscriptionRef.current = subscription;
  }, [conversationId, useRealtime]);

  // Set up real-time subscription
  useEffect(() => {
    if (!conversationId) return;

    setupRealtimeSubscription();

    // Cleanup on unmount or conversation change
    return () => {
      if (subscriptionRef.current && typeof subscriptionRef.current.unsubscribe === 'function') {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [conversationId, setupRealtimeSubscription]);

  // Handle new message from real-time
  const handleNewMessage = useCallback((newMessage) => {
    setMessages(prev => {
      // Check if message already exists (avoid duplicates)
      const exists = prev.some(msg => msg.id === newMessage.id);
      if (exists) return prev;

      // Format the message to match the expected structure
      const formattedMessage = {
        id: newMessage.id,
        content: newMessage.content,
        senderType: newMessage.senderType,
        messageType: newMessage.messageType || 'TEXT',
        isFromAI: newMessage.isFromAI || false,
        createdAt: newMessage.createdAt,
        isRead: newMessage.isRead || false,
        user: newMessage.user || {
          name: newMessage.senderType === 'CUSTOMER' ? 'Customer' :
                newMessage.senderType === 'AI' ? 'AI Assistant' : 'Agent',
          profileImage: null
        }
      };

      return [...prev, formattedMessage];
    });
  }, []);

  // Handle message update from real-time
  const handleMessageUpdate = useCallback((updatedMessage) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === updatedMessage.id ? {
          ...msg,
          content: updatedMessage.content,
          isRead: updatedMessage.isRead,
          readAt: updatedMessage.readAt,
          updatedAt: updatedMessage.updatedAt
        } : msg
      )
    );
  }, []);

  // Initial fetch when conversation changes
  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    } else {
      setMessages([]);
      setIsLoading(false);
    }
  }, [conversationId, fetchMessages]);

  // Set up real-time subscription
  useEffect(() => {
    if (useRealtime && conversationId) {
      setupRealtimeSubscription();
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [setupRealtimeSubscription, useRealtime, conversationId]);

  return {
    messages,
    isLoading,
    error,
    hasMore,
    fetchMessages,
    loadMore,
    refresh,
    sendMessage,
    markMessagesAsRead
  };
};

export default useMessages;
