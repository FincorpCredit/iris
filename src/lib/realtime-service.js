import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for real-time features
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.DATABASE_URL?.match(/https?:\/\/([^:]+)/)?.[0];
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase = null;

// Initialize Supabase client if credentials are available
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('Supabase credentials not found. Real-time features will be disabled.');
}

/**
 * Real-time service for chat widget using Supabase
 */
export class RealtimeService {
  constructor() {
    this.subscriptions = new Map();
    this.isConnected = false;
  }

  /**
   * Initialize real-time connection
   */
  async initialize() {
    if (!supabase) {
      console.warn('Supabase not initialized. Real-time features disabled.');
      return false;
    }

    try {
      // Test connection
      const { data, error } = await supabase.from('message').select('count').limit(1);
      if (error) throw error;
      
      this.isConnected = true;
      console.log('Real-time service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize real-time service:', error);
      return false;
    }
  }

  /**
   * Subscribe to chat messages for a specific chat
   */
  subscribeToChatMessages(chatId, callback) {
    if (!supabase || !this.isConnected) {
      console.warn('Real-time service not available');
      return null;
    }

    const subscriptionKey = `chat_messages_${chatId}`;
    
    // Unsubscribe existing subscription if any
    this.unsubscribe(subscriptionKey);

    const subscription = supabase
      .channel(`chat_messages_${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message',
          filter: `chatId=eq.${chatId}`
        },
        (payload) => {
          console.log('New message received:', payload);
          callback({
            type: 'NEW_MESSAGE',
            data: payload.new
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'message',
          filter: `chatId=eq.${chatId}`
        },
        (payload) => {
          console.log('Message updated:', payload);
          callback({
            type: 'MESSAGE_UPDATED',
            data: payload.new
          });
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionKey, subscription);
    return subscriptionKey;
  }

  /**
   * Subscribe to conversation session updates
   */
  subscribeToSessionUpdates(sessionId, callback) {
    if (!supabase || !this.isConnected) {
      console.warn('Real-time service not available');
      return null;
    }

    const subscriptionKey = `session_${sessionId}`;
    
    // Unsubscribe existing subscription if any
    this.unsubscribe(subscriptionKey);

    const subscription = supabase
      .channel(`session_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_session',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Session updated:', payload);
          callback({
            type: 'SESSION_UPDATED',
            data: payload.new
          });
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionKey, subscription);
    return subscriptionKey;
  }

  /**
   * Subscribe to typing indicators
   */
  subscribeToTypingIndicators(chatId, callback) {
    if (!supabase || !this.isConnected) {
      console.warn('Real-time service not available');
      return null;
    }

    const subscriptionKey = `typing_${chatId}`;
    
    // Unsubscribe existing subscription if any
    this.unsubscribe(subscriptionKey);

    const subscription = supabase
      .channel(`typing_${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicator',
          filter: `chatId=eq.${chatId}`
        },
        (payload) => {
          console.log('Typing indicator updated:', payload);
          callback({
            type: 'TYPING_UPDATED',
            data: payload.new
          });
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionKey, subscription);
    return subscriptionKey;
  }

  /**
   * Subscribe to chat notifications for agents
   */
  subscribeToChatNotifications(userId, callback) {
    if (!supabase || !this.isConnected) {
      console.warn('Real-time service not available');
      return null;
    }

    const subscriptionKey = `notifications_${userId}`;
    
    // Unsubscribe existing subscription if any
    this.unsubscribe(subscriptionKey);

    const subscription = supabase
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_notification',
          filter: `userId=eq.${userId}`
        },
        (payload) => {
          console.log('New notification:', payload);
          callback({
            type: 'NEW_NOTIFICATION',
            data: payload.new
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_notification',
          filter: `userId=eq.${userId}`
        },
        (payload) => {
          console.log('Notification updated:', payload);
          callback({
            type: 'NOTIFICATION_UPDATED',
            data: payload.new
          });
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionKey, subscription);
    return subscriptionKey;
  }

  /**
   * Subscribe to customer online status
   */
  subscribeToCustomerStatus(customerId, callback) {
    if (!supabase || !this.isConnected) {
      console.warn('Real-time service not available');
      return null;
    }

    const subscriptionKey = `customer_status_${customerId}`;
    
    // Unsubscribe existing subscription if any
    this.unsubscribe(subscriptionKey);

    const subscription = supabase
      .channel(`customer_status_${customerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'customer',
          filter: `id=eq.${customerId}`
        },
        (payload) => {
          console.log('Customer status updated:', payload);
          callback({
            type: 'CUSTOMER_STATUS_UPDATED',
            data: payload.new
          });
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionKey, subscription);
    return subscriptionKey;
  }

  /**
   * Broadcast typing indicator
   */
  async broadcastTypingIndicator(chatId, isTyping, userType, userId) {
    if (!supabase || !this.isConnected) {
      console.warn('Real-time service not available');
      return;
    }

    try {
      const channel = supabase.channel(`typing_${chatId}`);
      
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          chatId,
          isTyping,
          userType,
          userId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error broadcasting typing indicator:', error);
    }
  }

  /**
   * Broadcast message delivery status
   */
  async broadcastMessageStatus(messageId, status, chatId) {
    if (!supabase || !this.isConnected) {
      console.warn('Real-time service not available');
      return;
    }

    try {
      const channel = supabase.channel(`chat_messages_${chatId}`);
      
      await channel.send({
        type: 'broadcast',
        event: 'message_status',
        payload: {
          messageId,
          status,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error broadcasting message status:', error);
    }
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subscriptionKey) {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(subscriptionKey);
      console.log(`Unsubscribed from ${subscriptionKey}`);
    }
  }

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll() {
    for (const [key, subscription] of this.subscriptions) {
      supabase.removeChannel(subscription);
      console.log(`Unsubscribed from ${key}`);
    }
    this.subscriptions.clear();
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      activeSubscriptions: this.subscriptions.size,
      subscriptions: Array.from(this.subscriptions.keys())
    };
  }

  /**
   * Cleanup and disconnect
   */
  disconnect() {
    this.unsubscribeAll();
    this.isConnected = false;
    console.log('Real-time service disconnected');
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();

// Export utility functions
export const initializeRealtime = async () => {
  return await realtimeService.initialize();
};

export const getRealtimeStatus = () => {
  return realtimeService.getConnectionStatus();
};
