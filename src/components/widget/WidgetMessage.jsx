'use client'

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bot, User, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Widget Message Component
 * Displays individual messages in the chat widget
 */
export const WidgetMessage = ({
  message,
  theme,
  showAvatar = true,
  className,
  ...props
}) => {
  // Safety check for message object
  if (!message || !message.content) {
    return null;
  }

  // Default theme values
  const safeTheme = {
    primaryColor: '#3b82f6',
    textColor: '#1f2937',
    backgroundColor: '#ffffff',
    ...theme
  };

  const isCustomer = message.senderType === 'CUSTOMER';
  const isAI = message.isFromAI || message.senderType === 'AI';
  const isSystem = message.senderType === 'SYSTEM';

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Get message status icon
  const getStatusIcon = () => {
    if (isCustomer) {
      if (message.readAt) {
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      } else if (message.deliveredAt) {
        return <Check className="h-3 w-3 text-gray-400" />;
      }
    }
    return null;
  };

  // System messages (like notifications)
  if (isSystem) {
    return (
      <div className={cn('flex justify-center my-2', className)}>
        <Badge variant="secondary" className="text-xs px-2 py-1">
          {message.content}
        </Badge>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex gap-2 w-full',
        isCustomer ? 'justify-end' : 'justify-start',
        className
      )}
      {...props}
    >
      {/* Avatar */}
      {showAvatar && !isCustomer && (
        <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
          {isAI ? (
            <>
              <AvatarImage src="/iris-avatar.svg" alt="AI Assistant" />
              <AvatarFallback style={{ backgroundColor: safeTheme.primaryColor + '20', color: safeTheme.primaryColor }}>
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </>
          ) : (
            <>
              <AvatarImage src={message.user?.profileImage} alt={message.user?.name || 'Agent'} />
              <AvatarFallback style={{ backgroundColor: safeTheme.primaryColor + '20', color: safeTheme.primaryColor }}>
                {message.user?.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
              </AvatarFallback>
            </>
          )}
        </Avatar>
      )}

      {/* Message Content Container */}
      <div
        className={cn(
          'flex flex-col min-w-0', // min-w-0 allows flex child to shrink
          isCustomer ? 'items-end max-w-[280px]' : 'items-start max-w-[280px]',
          showAvatar && !isCustomer ? 'flex-1' : 'flex-1'
        )}
      >
        {/* Sender Name (for non-customer messages) */}
        {!isCustomer && showAvatar && (
          <div className="text-xs text-gray-500 mb-1 px-1 truncate max-w-full">
            {isAI ? 'Iris Assistant' : message.user?.name || 'Agent'}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={cn(
            'rounded-lg px-3 py-2 w-fit max-w-full min-w-0',
            isCustomer
              ? 'rounded-br-sm'
              : 'rounded-bl-sm'
          )}
          style={{
            backgroundColor: isCustomer
              ? safeTheme.primaryColor
              : safeTheme.backgroundColor === '#ffffff'
                ? '#f3f4f6'
                : safeTheme.backgroundColor + '80',
            color: isCustomer
              ? safeTheme.backgroundColor
              : safeTheme.textColor,
            border: !isCustomer ? `1px solid ${safeTheme.primaryColor}20` : 'none'
          }}
        >
          {/* Message Text */}
          <div className="text-sm leading-relaxed chat-message-content">
            {message.content}
          </div>

          {/* Message Type Indicators */}
          {message.messageType && message.messageType !== 'TEXT' && (
            <div className="mt-1">
              <Badge variant="outline" className="text-xs">
                {message.messageType.toLowerCase()}
              </Badge>
            </div>
          )}

          {/* AI Model Info (for development) */}
          {isAI && message.aiModel && process.env.NODE_ENV === 'development' && (
            <div className="mt-1 text-xs opacity-60 break-words">
              <div>Model: {message.aiModel}</div>
              {message.tokenUsage && (
                <div>
                  Tokens: {message.tokenUsage.promptTokens + message.tokenUsage.completionTokens}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Message Metadata */}
        <div className={cn(
          'flex items-center gap-1 mt-1 text-xs text-gray-400 px-1',
          isCustomer ? 'flex-row-reverse' : 'flex-row'
        )}>
          <span className="whitespace-nowrap">{formatTime(message.createdAt)}</span>
          {getStatusIcon()}
        </div>
      </div>

      {/* Spacer for customer messages to maintain alignment */}
      {isCustomer && showAvatar && (
        <div className="w-8 flex-shrink-0" />
      )}
    </div>
  );
};

export default WidgetMessage;
