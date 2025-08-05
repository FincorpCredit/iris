'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './authContext';
import { realtimeService } from '@/lib/realtime-service';

const RealtimeContext = createContext({});

/**
 * Real-time Context Provider
 * Manages Supabase real-time subscriptions for the entire application
 */
export const RealtimeProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [subscriptions, setSubscriptions] = useState(new Map());
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const [typingIndicators, setTypingIndicators] = useState(new Map());

  // Initialize real-time connection
  const initializeConnection = useCallback(async () => {
    if (!user || !token) return;

    try {
      setConnectionStatus('connecting');
      const connected = await realtimeService.initialize();
      
      if (connected) {
        setIsConnected(true);
        setConnectionStatus('connected');
        console.log('Real-time connection established');
      } else {
        setConnectionStatus('failed');
        console.warn('Real-time connection failed');
      }
    } catch (error) {
      console.error('Real-time initialization error:', error);
      setConnectionStatus('failed');
    }
  }, [user, token]);

  // Subscribe to notifications for current user
  const subscribeToNotifications = useCallback(() => {
    if (!isConnected || !user?.id) return null;

    const subscriptionKey = realtimeService.subscribeToChatNotifications(
      user.id,
      (update) => {
        console.log('Notification update received:', update);
        
        switch (update.type) {
          case 'NEW_NOTIFICATION':
            setNotifications(prev => [update.data, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show browser notification if permission granted
            showBrowserNotification(update.data);
            break;
            
          case 'NOTIFICATION_UPDATED':
            setNotifications(prev => 
              prev.map(notif => 
                notif.id === update.data.id ? update.data : notif
              )
            );
            
            // Update unread count if notification was marked as read
            if (update.data.isRead) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
            break;
        }
      }
    );

    if (subscriptionKey) {
      setSubscriptions(prev => new Map(prev).set('notifications', subscriptionKey));
    }

    return subscriptionKey;
  }, [isConnected, user?.id]);

  // Subscribe to chat messages for a specific chat
  const subscribeToChatMessages = useCallback((chatId, callback) => {
    if (!isConnected || !chatId) return null;

    const subscriptionKey = realtimeService.subscribeToChatMessages(
      chatId,
      (update) => {
        console.log('Chat message update:', update);
        callback(update);
      }
    );

    if (subscriptionKey) {
      setSubscriptions(prev => {
        const newSubs = new Map(prev);
        newSubs.set(`chat_${chatId}`, subscriptionKey);
        return newSubs;
      });
    }

    return subscriptionKey;
  }, [isConnected]);

  // Subscribe to typing indicators for a chat
  const subscribeToTypingIndicators = useCallback((chatId, callback) => {
    if (!isConnected || !chatId) return null;

    const subscriptionKey = realtimeService.subscribeToTypingIndicators(
      chatId,
      (update) => {
        console.log('Typing indicator update:', update);

        if (update.type === 'TYPING_UPDATED') {
          const data = update.data;
          const key = `${data.channelId}_${data.userId}`;

          if (data.isTyping) {
            setTypingIndicators(prev => new Map(prev).set(key, {
              channelId: data.channelId,
              userId: data.userId,
              userType: data.userType,
              timestamp: data.timestamp
            }));

            // Auto-expire typing indicator after 5 seconds
            setTimeout(() => {
              setTypingIndicators(prev => {
                const newMap = new Map(prev);
                newMap.delete(key);
                return newMap;
              });
            }, 5000);
          } else {
            setTypingIndicators(prev => {
              const newMap = new Map(prev);
              newMap.delete(key);
              return newMap;
            });
          }
        }

        callback(update);
      }
    );

    if (subscriptionKey) {
      setSubscriptions(prev => {
        const newSubs = new Map(prev);
        newSubs.set(`typing_${chatId}`, subscriptionKey);
        return newSubs;
      });
    }

    return subscriptionKey;
  }, [isConnected]);

  // Subscribe to customer online status
  const subscribeToCustomerStatus = useCallback((customerId, callback) => {
    if (!isConnected || !customerId) return null;

    const subscriptionKey = realtimeService.subscribeToCustomerStatus(
      customerId,
      (update) => {
        console.log('Customer status update:', update);
        
        if (update.type === 'CUSTOMER_STATUS_UPDATED') {
          setOnlineUsers(prev => new Map(prev).set(customerId, {
            id: customerId,
            isOnline: update.data.isOnline,
            lastSeenAt: update.data.lastSeenAt
          }));
        }
        
        callback(update);
      }
    );

    if (subscriptionKey) {
      setSubscriptions(prev => {
        const newSubs = new Map(prev);
        newSubs.set(`customer_${customerId}`, subscriptionKey);
        return newSubs;
      });
    }

    return subscriptionKey;
  }, [isConnected]);

  // Unsubscribe from a specific subscription
  const unsubscribe = useCallback((subscriptionKey) => {
    if (subscriptionKey) {
      realtimeService.unsubscribe(subscriptionKey);
      setSubscriptions(prev => {
        const newSubs = new Map(prev);
        // Find and remove the subscription
        for (const [key, value] of newSubs) {
          if (value === subscriptionKey) {
            newSubs.delete(key);
            break;
          }
        }
        return newSubs;
      });
    }
  }, []);

  // Broadcast typing indicator
  const broadcastTyping = useCallback(async (channelId, isTyping) => {
    if (!isConnected || !user?.id) return;

    try {
      await realtimeService.broadcastTypingIndicator(
        channelId,
        isTyping,
        'AGENT',
        user.id
      );
    } catch (error) {
      console.error('Error broadcasting typing indicator:', error);
    }
  }, [isConnected, user?.id]);

  // Show browser notification
  const showBrowserNotification = useCallback((notification) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `chat_${notification.chatId}`,
        requireInteraction: false,
        silent: false
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);

      // Handle click
      browserNotification.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
        browserNotification.close();
      };
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  // Clean up expired typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTypingIndicators(prev => {
        const filtered = new Map();
        for (const [key, indicator] of prev) {
          if (new Date(indicator.expiresAt) > now) {
            filtered.set(key, indicator);
          }
        }
        return filtered;
      });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Initialize connection when user is authenticated
  useEffect(() => {
    if (user && token) {
      initializeConnection();
    } else {
      // Disconnect when user logs out
      if (isConnected) {
        realtimeService.disconnect();
        setIsConnected(false);
        setConnectionStatus('disconnected');
        setSubscriptions(new Map());
        setNotifications([]);
        setUnreadCount(0);
        setOnlineUsers(new Map());
        setTypingIndicators(new Map());
      }
    }
  }, [user, token, initializeConnection, isConnected]);

  // Subscribe to notifications when connected
  useEffect(() => {
    if (isConnected && user?.id) {
      subscribeToNotifications();
    }
  }, [isConnected, user?.id, subscribeToNotifications]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      realtimeService.disconnect();
    };
  }, []);

  const contextValue = {
    // Connection state
    isConnected,
    connectionStatus,
    
    // Notifications
    notifications,
    unreadCount,
    
    // Online status
    onlineUsers,
    
    // Typing indicators
    typingIndicators,
    
    // Subscription methods
    subscribeToChatMessages,
    subscribeToTypingIndicators,
    subscribeToCustomerStatus,
    unsubscribe,
    
    // Broadcasting methods
    broadcastTyping,
    
    // Notification methods
    requestNotificationPermission,
    
    // Utility methods
    getConnectionStatus: () => realtimeService.getConnectionStatus(),
    reconnect: initializeConnection
  };

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
};

// Custom hook to use real-time context
export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

export default RealtimeContext;
