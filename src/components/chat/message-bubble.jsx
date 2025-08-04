'use client'

import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AgentTypeBadge } from '@/components/common/status-indicator'

// Message timestamp component
const MessageTimestamp = ({ timestamp, className }) => {
  const formatTime = (timestamp) => {
    const messageTime = new Date(timestamp)
    return messageTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  return (
    <span className={cn('text-xs text-muted-foreground', className)}>
      {formatTime(timestamp)}
    </span>
  )
}

// Message avatar with agent type indicator
const MessageAvatar = ({ 
  src, 
  name, 
  agentType, 
  size = 'small',
  className 
}) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-10 h-10'
  }

  return (
    <div className={cn('relative flex-shrink-0', className)}>
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={src} alt={name} />
        <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
          {name?.charAt(0)?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      {agentType && (
        <AgentTypeBadge 
          type={agentType} 
          className="scale-75 -bottom-0.5 -right-0.5" 
        />
      )}
    </div>
  )
}

// Message content with different styles for own vs received messages
const MessageContent = ({ 
  message, 
  isOwn, 
  agentType,
  className 
}) => {
  const getBubbleStyles = () => {
    if (isOwn) {
      return 'bg-primary text-primary-foreground border border-primary/20 shadow-sm'
    }
    
    // Different colors for AI vs human agents
    if (agentType === 'ai') {
      return 'bg-blue-50 dark:bg-blue-950/30 text-foreground border border-blue-200 dark:border-blue-800'
    }
    
    return 'bg-muted text-foreground border border-border'
  }

  return (
    <div 
      className={cn(
        'max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-normal whitespace-pre-wrap word-break-break-word',
        getBubbleStyles(),
        className
      )}
    >
      {message}
    </div>
  )
}

// Message status indicators (delivered, read, etc.)
const MessageStatus = ({ 
  status = 'sent', 
  isOwn,
  className 
}) => {
  if (!isOwn) return null

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return '○'
      case 'sent':
        return '✓'
      case 'delivered':
        return '✓✓'
      case 'read':
        return '✓✓'
      default:
        return '○'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'read':
        return 'text-blue-500'
      case 'delivered':
        return 'text-muted-foreground'
      case 'sent':
        return 'text-muted-foreground'
      case 'sending':
        return 'text-muted-foreground/50'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <span className={cn('text-xs ml-2', getStatusColor(), className)}>
      {getStatusIcon()}
    </span>
  )
}

// Main message bubble component
const MessageBubble = ({
  message,
  timestamp,
  isOwn = false,
  senderAvatar,
  senderName,
  agentType,
  status = 'sent',
  showAvatar = true,
  showTimestamp = true,
  className
}) => {
  return (
    <div className={cn('flex gap-2 mb-4', isOwn && 'flex-row-reverse', className)}>
      {/* Avatar (only for received messages or when explicitly shown) */}
      {showAvatar && (!isOwn || (isOwn && senderAvatar)) && (
        <MessageAvatar
          src={senderAvatar}
          name={senderName}
          agentType={!isOwn ? agentType : undefined}
          size="small"
        />
      )}

      {/* Message content and metadata */}
      <div className={cn('flex flex-col gap-1', isOwn && 'items-end')}>
        {/* Sender name for received messages */}
        {!isOwn && senderName && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-medium text-foreground">
              {senderName}
            </span>
            {agentType && (
              <Badge 
                variant={agentType === 'ai' ? 'default' : 'secondary'}
                className="text-xs px-1.5 py-0.5 h-auto"
              >
                {agentType === 'ai' ? 'AI' : 'Agent'}
              </Badge>
            )}
          </div>
        )}

        {/* Message bubble */}
        <MessageContent
          message={message}
          isOwn={isOwn}
          agentType={agentType}
        />

        {/* Timestamp and status */}
        {showTimestamp && (
          <div className={cn('flex items-center px-1', isOwn && 'flex-row-reverse')}>
            <MessageTimestamp timestamp={timestamp} />
            <MessageStatus status={status} isOwn={isOwn} />
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageBubble
export { MessageAvatar, MessageContent, MessageTimestamp, MessageStatus }