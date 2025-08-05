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
 * Hook for managing real-time typing indicators on the client side
 */
export const useRealtimeTyping = (channelId) => {
  const [typingIndicators, setTypingIndicators] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionRef = useRef(null);

  // Subscribe to typing indicators for a specific channel
  const subscribeToTyping = useCallback((channelId) => {
    if (!supabase || !channelId) {
      console.warn('Supabase not available or no channel ID provided');
      return;
    }

    // Unsubscribe from previous subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    // Create new subscription
    const channel = supabase.channel(`typing_${channelId}`);
    
    subscriptionRef.current = channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        console.log('Typing indicator received:', payload);
        
        const data = payload.payload;
        const key = `${data.channelId}_${data.userId}`;
        
        if (data.isTyping) {
          // Add typing indicator
          setTypingIndicators(prev => {
            const newIndicators = prev.filter(ind => ind.key !== key);
            return [...newIndicators, {
              key,
              channelId: data.channelId,
              userId: data.userId,
              userType: data.userType,
              timestamp: data.timestamp,
              user: data.userType === 'AGENT' ? { name: 'Agent' } : null
            }];
          });

          // Auto-expire after 5 seconds
          setTimeout(() => {
            setTypingIndicators(prev => prev.filter(ind => ind.key !== key));
          }, 5000);
        } else {
          // Remove typing indicator
          setTypingIndicators(prev => prev.filter(ind => ind.key !== key));
        }
      })
      .subscribe((status) => {
        console.log('Typing subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

  }, []);

  // Subscribe when channelId changes
  useEffect(() => {
    if (channelId) {
      subscribeToTyping(channelId);
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [channelId, subscribeToTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  return {
    typingIndicators,
    isConnected
  };
};
