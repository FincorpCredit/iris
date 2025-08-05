'use client'

import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRealtime } from '@/context/realtimeContext';

/**
 * Typing Indicator Component
 * Shows who is currently typing in a chat with real-time updates
 */
export const TypingIndicator = ({ 
  chatId, 
  className,
  showAvatars = true,
  maxVisible = 3,
  ...props 
}) => {
  const { typingIndicators } = useRealtime();
  const [chatTypingUsers, setChatTypingUsers] = useState([]);

  // Filter typing indicators for this chat
  useEffect(() => {
    if (!chatId) {
      setChatTypingUsers([]);
      return;
    }

    const chatIndicators = Array.from(typingIndicators.values())
      .filter(indicator => indicator.channelId === chatId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setChatTypingUsers(chatIndicators);
  }, [typingIndicators, chatId]);

  // Don't render if no one is typing
  if (chatTypingUsers.length === 0) {
    return null;
  }

  // Get visible users (limit to maxVisible)
  const visibleUsers = chatTypingUsers.slice(0, maxVisible);
  const hiddenCount = Math.max(0, chatTypingUsers.length - maxVisible);

  // Format typing text
  const getTypingText = () => {
    const userNames = visibleUsers.map(user => {
      if (user.userType === 'AGENT') {
        return user.user?.name || 'Agent';
      } else {
        return user.customer?.name || 'Customer';
      }
    });

    if (userNames.length === 0) return '';

    if (userNames.length === 1) {
      return `${userNames[0]} is typing...`;
    } else if (userNames.length === 2) {
      return `${userNames[0]} and ${userNames[1]} are typing...`;
    } else {
      const others = hiddenCount > 0 ? ` and ${hiddenCount} other${hiddenCount > 1 ? 's' : ''}` : '';
      return `${userNames.slice(0, -1).join(', ')}, ${userNames[userNames.length - 1]}${others} are typing...`;
    }
  };

  return (
    <div className={cn('flex items-center gap-2 py-2', className)} {...props}>
      {/* Avatars */}
      {showAvatars && (
        <div className="flex -space-x-2">
          {visibleUsers.map((user, index) => (
            <TypingAvatar
              key={`${user.userId || user.customerId}_${index}`}
              user={user}
              className="border-2 border-background"
            />
          ))}
          {hiddenCount > 0 && (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 border-2 border-background text-xs font-medium text-gray-600">
              +{hiddenCount}
            </div>
          )}
        </div>
      )}

      {/* Typing text with animated dots */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>{getTypingText()}</span>
        <TypingDots />
      </div>
    </div>
  );
};

/**
 * Typing Avatar Component
 */
const TypingAvatar = ({ user, className }) => {
  const isAgent = user.userType === 'AGENT';
  
  return (
    <div className={cn('relative', className)}>
      <Avatar className="w-8 h-8">
        <AvatarImage 
          src={isAgent ? user.user?.profileImage : user.customer?.avatar} 
          alt={isAgent ? user.user?.name : user.customer?.name}
        />
        <AvatarFallback className="text-xs">
          {isAgent ? (
            user.user?.name?.charAt(0)?.toUpperCase() || <User className="w-3 h-3" />
          ) : (
            user.customer?.name?.charAt(0)?.toUpperCase() || <Bot className="w-3 h-3" />
          )}
        </AvatarFallback>
      </Avatar>
      
      {/* Typing indicator dot */}
      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border border-background">
        <div className="w-full h-full bg-green-500 rounded-full animate-pulse" />
      </div>
    </div>
  );
};

/**
 * Animated Typing Dots Component
 */
const TypingDots = ({ className }) => {
  return (
    <div className={cn('flex items-center space-x-1', className)}>
      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
};

/**
 * Compact Typing Indicator
 * Shows just a badge with typing count
 */
export const CompactTypingIndicator = ({ 
  chatId, 
  className,
  ...props 
}) => {
  const { typingIndicators } = useRealtime();
  const [typingCount, setTypingCount] = useState(0);

  useEffect(() => {
    if (!chatId) {
      setTypingCount(0);
      return;
    }

    const count = Array.from(typingIndicators.values())
      .filter(indicator => indicator.channelId === chatId)
      .length;

    setTypingCount(count);
  }, [typingIndicators, chatId]);

  if (typingCount === 0) {
    return null;
  }

  return (
    <Badge 
      variant="secondary" 
      className={cn('text-xs animate-pulse', className)}
      {...props}
    >
      {typingCount === 1 ? '1 typing' : `${typingCount} typing`}
    </Badge>
  );
};

/**
 * Hook for managing typing state
 */
export const useTypingIndicator = (chatId) => {
  const { broadcastTyping } = useRealtime();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = React.useRef(null);

  const startTyping = React.useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      broadcastTyping(chatId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      broadcastTyping(chatId, false);
    }, 3000); // Stop typing after 3 seconds of inactivity
  }, [chatId, isTyping, broadcastTyping]);

  const stopTyping = React.useCallback(() => {
    if (isTyping) {
      setIsTyping(false);
      broadcastTyping(chatId, false);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [chatId, isTyping, broadcastTyping]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        broadcastTyping(chatId, false);
      }
    };
  }, [chatId, isTyping, broadcastTyping]);

  return {
    isTyping,
    startTyping,
    stopTyping
  };
};

export default TypingIndicator;
