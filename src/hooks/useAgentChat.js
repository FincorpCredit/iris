import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/authContext';

/**
 * Custom hook for managing agent chat functionality
 * Handles chat assignment, messaging, notifications, and real-time updates
 */
export const useAgentChat = () => {
  const { user, token } = useAuth();
  const [chats, setChats] = useState([]);
  const [unassignedChats, setUnassignedChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const pollingIntervalRef = useRef(null);
  const notificationPollingRef = useRef(null);

  // API headers
  const getHeaders = useCallback(() => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }), [token]);

  // Load agent chats
  const loadChats = useCallback(async (filters = {}) => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status.join(','));
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.source) queryParams.append('source', filters.source);
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.offset) queryParams.append('offset', filters.offset.toString());

      const response = await fetch(`/api/agent/chats?${queryParams}`, {
        headers: getHeaders()
      });

      const data = await response.json();

      if (data.success) {
        setChats(data.chats);
      } else {
        throw new Error(data.error || 'Failed to load chats');
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [token, getHeaders]);

  // Load unassigned chats
  const loadUnassignedChats = useCallback(async (filters = {}) => {
    if (!token) return;

    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status.join(','));
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.source) queryParams.append('source', filters.source);
      if (filters.limit) queryParams.append('limit', filters.limit.toString());

      const response = await fetch(`/api/agent/chats/unassigned?${queryParams}`, {
        headers: getHeaders()
      });

      const data = await response.json();

      if (data.success) {
        setUnassignedChats(data.chats);
      } else {
        throw new Error(data.error || 'Failed to load unassigned chats');
      }
    } catch (error) {
      console.error('Error loading unassigned chats:', error);
      setError(error.message);
    }
  }, [token, getHeaders]);

  // Load chat messages
  const loadMessages = useCallback(async (chatId, limit = 50, offset = 0) => {
    if (!token || !chatId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/agent/chats/${chatId}/messages?limit=${limit}&offset=${offset}`, {
        headers: getHeaders()
      });

      const data = await response.json();

      if (data.success) {
        setMessages(data.messages);
        
        // Mark messages as read
        await markMessagesAsRead(chatId);
      } else {
        throw new Error(data.error || 'Failed to load messages');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [token, getHeaders]);

  // Send message
  const sendMessage = useCallback(async (chatId, content, messageType = 'TEXT') => {
    if (!token || !chatId || !content.trim()) return;

    try {
      setError(null);

      const response = await fetch(`/api/agent/chats/${chatId}/messages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          content: content.trim(),
          messageType
        })
      });

      const data = await response.json();

      if (data.success) {
        // Add message to local state
        setMessages(prev => [...prev, data.message]);
        
        // Update chat in list
        setChats(prev => prev.map(chat => 
          chat.id === chatId 
            ? { 
                ...chat, 
                lastMessage: data.message,
                lastMessageAt: data.message.createdAt,
                messageCount: chat.messageCount + 1
              }
            : chat
        ));

        return data.message;
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message);
      throw error;
    }
  }, [token, getHeaders]);

  // Assign chat to agent
  const assignChat = useCallback(async (chatId) => {
    if (!token || !chatId) return;

    try {
      setError(null);

      const response = await fetch('/api/agent/chats', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          chatId,
          action: 'assign'
        })
      });

      const data = await response.json();

      if (data.success) {
        // Remove from unassigned and add to assigned
        setUnassignedChats(prev => prev.filter(chat => chat.id !== chatId));
        setChats(prev => [...prev, data.chat]);
        
        return data.chat;
      } else {
        throw new Error(data.error || 'Failed to assign chat');
      }
    } catch (error) {
      console.error('Error assigning chat:', error);
      setError(error.message);
      throw error;
    }
  }, [token, getHeaders]);

  // Transfer chat to another agent
  const transferChat = useCallback(async (chatId, toAgentId, reason = '') => {
    if (!token || !chatId || !toAgentId) return;

    try {
      setError(null);

      const response = await fetch('/api/agent/chats', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          chatId,
          action: 'transfer',
          toAgentId,
          reason
        })
      });

      const data = await response.json();

      if (data.success) {
        // Remove from current agent's chats
        setChats(prev => prev.filter(chat => chat.id !== chatId));
        
        // Clear active chat if it was the transferred one
        if (activeChat?.id === chatId) {
          setActiveChat(null);
          setMessages([]);
        }
        
        return data.chat;
      } else {
        throw new Error(data.error || 'Failed to transfer chat');
      }
    } catch (error) {
      console.error('Error transferring chat:', error);
      setError(error.message);
      throw error;
    }
  }, [token, getHeaders, activeChat]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (chatId, messageIds = null) => {
    if (!token || !chatId) return;

    try {
      await fetch(`/api/agent/chats/${chatId}/messages`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ messageIds })
      });

      // Update local chat state
      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, unreadCount: 0 }
          : chat
      ));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [token, getHeaders]);

  // Load notifications
  const loadNotifications = useCallback(async (unreadOnly = false) => {
    if (!token) return;

    try {
      const queryParams = new URLSearchParams();
      if (unreadOnly) queryParams.append('unread_only', 'true');

      const response = await fetch(`/api/agent/notifications?${queryParams}`, {
        headers: getHeaders()
      });

      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } else {
        throw new Error(data.error || 'Failed to load notifications');
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [token, getHeaders]);

  // Mark notifications as read
  const markNotificationsAsRead = useCallback(async (notificationIds = null, markAllAsRead = false) => {
    if (!token) return;

    try {
      const response = await fetch('/api/agent/notifications', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          notificationIds,
          markAllAsRead
        })
      });

      const data = await response.json();

      if (data.success) {
        setUnreadCount(data.unreadCount);
        
        // Update local notifications state
        if (markAllAsRead) {
          setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true, readAt: new Date() })));
        } else if (notificationIds) {
          setNotifications(prev => prev.map(notif => 
            notificationIds.includes(notif.id) 
              ? { ...notif, isRead: true, readAt: new Date() }
              : notif
          ));
        }
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }, [token, getHeaders]);

  // Set active chat
  const selectChat = useCallback((chat) => {
    setActiveChat(chat);
    if (chat) {
      loadMessages(chat.id);
    } else {
      setMessages([]);
    }
  }, [loadMessages]);

  // Initialize data loading
  useEffect(() => {
    if (token && user) {
      loadChats();
      loadUnassignedChats();
      loadNotifications();
    }
  }, [token, user, loadChats, loadUnassignedChats, loadNotifications]);

  // Set up polling for real-time updates
  useEffect(() => {
    if (!token) return;

    // Poll for chat updates every 30 seconds
    pollingIntervalRef.current = setInterval(() => {
      loadChats();
      loadUnassignedChats();
    }, 30000);

    // Poll for notifications every 15 seconds
    notificationPollingRef.current = setInterval(() => {
      loadNotifications(true); // Only unread notifications
    }, 15000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (notificationPollingRef.current) {
        clearInterval(notificationPollingRef.current);
      }
    };
  }, [token, loadChats, loadUnassignedChats, loadNotifications]);

  return {
    // State
    chats,
    unassignedChats,
    activeChat,
    messages,
    notifications,
    unreadCount,
    isLoading,
    error,

    // Actions
    loadChats,
    loadUnassignedChats,
    loadMessages,
    sendMessage,
    assignChat,
    transferChat,
    markMessagesAsRead,
    loadNotifications,
    markNotificationsAsRead,
    selectChat,

    // Computed values
    totalUnreadMessages: chats.reduce((sum, chat) => sum + chat.unreadCount, 0),
    urgentChats: chats.filter(chat => chat.priority === 'URGENT'),
    waitingChats: unassignedChats.filter(chat => chat.waitingTime > 5 * 60 * 1000) // 5 minutes
  };
};
