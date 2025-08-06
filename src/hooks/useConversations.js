import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for real-time features
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Custom hook for fetching and managing conversations with real-time updates
 */
export const useConversations = (options = {}) => {
  const {
    limit = 50,
    status = 'all', // 'all', 'assigned', 'unattended'
    useRealtime = true
  } = options;

  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: limit,
    offset: 0,
    hasMore: false
  });
  const subscriptionRef = useRef(null);

  // Fetch conversations from API
  const fetchConversations = useCallback(async (offset = 0, append = false) => {
    try {
      if (!append) {
        setIsLoading(true);
      }
      setError(null);

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        status
      });

      const response = await fetch(`/api/conversations?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch conversations');
      }

      if (append) {
        setConversations(prev => [...prev, ...data.conversations]);
      } else {
        setConversations(data.conversations);
      }

      setPagination(data.pagination);

    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [limit, status]);

  // Load more conversations (pagination)
  const loadMore = useCallback(() => {
    if (pagination.hasMore && !isLoading) {
      fetchConversations(pagination.offset + pagination.limit, true);
    }
  }, [fetchConversations, pagination, isLoading]);

  // Refresh conversations
  const refresh = useCallback(() => {
    fetchConversations(0, false);
  }, [fetchConversations]);

  // Update a specific conversation (for optimistic updates)
  const updateConversation = useCallback((conversationId, updates) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId || conv.conversationId === conversationId
          ? { ...conv, ...updates }
          : conv
      )
    );
  }, []);

  // Remove a conversation
  const removeConversation = useCallback((conversationId) => {
    setConversations(prev => 
      prev.filter(conv => 
        conv.id !== conversationId && conv.conversationId !== conversationId
      )
    );
  }, []);

  // Add a new conversation
  const addConversation = useCallback((newConversation) => {
    setConversations(prev => [newConversation, ...prev]);
  }, []);

  // Set up real-time subscription
  const setupRealtimeSubscription = useCallback(() => {
    if (!supabase || !useRealtime) return;

    // Unsubscribe from previous subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    // Subscribe to chat table changes and typing indicators
    const subscription = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'chat'
        },
        (payload) => {
          console.log('Real-time chat update:', payload);

          // Handle different types of changes
          switch (payload.eventType) {
            case 'INSERT':
              // Add new conversation
              handleNewConversation(payload.new);
              break;
            case 'UPDATE':
              // Update existing conversation
              handleConversationUpdate(payload.new);
              break;
            case 'DELETE':
              // Remove conversation
              handleConversationDelete(payload.old.id);
              break;
          }
        }
      )
      .on(
        'broadcast',
        { event: 'typing' },
        (payload) => {
          console.log('Typing indicator received in conversations:', payload);
          handleTypingIndicator(payload.payload);
        }
      )
      .subscribe();

    subscriptionRef.current = subscription;
  }, [useRealtime]);

  // Handle typing indicator updates
  const handleTypingIndicator = useCallback((typingData) => {
    const { channelId, isTyping, userType, userId } = typingData;

    // Update the conversation with typing indicator
    updateConversation(channelId, {
      isTyping: isTyping,
      typingUser: isTyping ? { userType, userId } : null,
      lastTypingAt: isTyping ? new Date().toISOString() : null
    });
  }, [updateConversation]);

  // Handle new conversation
  const handleNewConversation = useCallback(async (newChat) => {
    // Fetch full conversation data for the new chat
    try {
      const response = await fetch(`/api/conversations/${newChat.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          addConversation(data.conversation);
        }
      }
    } catch (error) {
      console.error('Error fetching new conversation:', error);
    }
  }, []);

  // Handle conversation update
  const handleConversationUpdate = useCallback((updatedChat) => {
    updateConversation(updatedChat.id, {
      status: updatedChat.status,
      assignedAgentId: updatedChat.assignedAgentId,
      lastMessageAt: updatedChat.lastMessageAt,
      unreadCount: updatedChat.unreadCount,
      messageCount: updatedChat.messageCount
    });
  }, [updateConversation]);

  // Handle conversation deletion
  const handleConversationDelete = useCallback((chatId) => {
    removeConversation(chatId);
  }, [removeConversation]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Set up real-time subscription
  useEffect(() => {
    if (useRealtime) {
      setupRealtimeSubscription();
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [setupRealtimeSubscription, useRealtime]);

  return {
    conversations,
    isLoading,
    error,
    pagination,
    fetchConversations,
    loadMore,
    refresh,
    updateConversation,
    removeConversation,
    addConversation
  };
};

/**
 * Hook for fetching conversations by status
 */
export const useConversationsByStatus = (status = 'all') => {
  return useConversations({ status });
};

/**
 * Hook for unattended (AI-handled) conversations
 */
export const useUnattendedConversations = () => {
  return useConversations({ status: 'unattended' });
};

/**
 * Hook for assigned conversations
 */
export const useAssignedConversations = () => {
  return useConversations({ status: 'assigned' });
};

export default useConversations;
