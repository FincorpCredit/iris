'use client'

import React, { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { ChatStatusIndicator } from './ChatStatusIndicator'
import { ChatAssignmentButton } from './ChatAssignmentButton'

/**
 * ChatListItem - Enhanced conversation item with AI/Agent status and take over functionality
 */
export const ChatListItem = ({
  id,
  chatId,
  conversationId,
  name,
  avatar,
  lastMessage,
  lastMessageAt,
  unreadCount = 0,
  isActive = false,
  isOnline = false,
  assignedAgentId = null,
  assignedAgent = null,
  aiEnabled = true,
  priority = 'MEDIUM',
  source = 'WIDGET',
  showAIIndicator = false,
  showTakeOverButton = false,
  onConversationSelect,
  onTakeOver,
  className = ''
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const isAIHandled = !assignedAgentId
  const isAssignedToMe = assignedAgent?.isCurrentUser || false

  // Update current time every minute to refresh relative timestamps
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    onConversationSelect?.(id || conversationId)
  }

  const handleTakeOver = async (chatId, conversationId) => {
    await onTakeOver?.(chatId, conversationId)
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500'
      case 'HIGH': return 'bg-orange-500'
      case 'MEDIUM': return 'bg-blue-500'
      case 'LOW': return 'bg-gray-500'
      default: return 'bg-blue-500'
    }
  }

  const getSourceIcon = (source) => {
    switch (source) {
      case 'WIDGET': return '💬'
      case 'EMAIL': return '📧'
      case 'PHONE': return '📞'
      case 'SOCIAL': return '📱'
      default: return '💬'
    }
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-muted/40 group',
        isActive && 'bg-muted/60 border border-border/50 shadow-sm',
        className
      )}
    >
      {/* Avatar with status indicators */}
      <div className="relative flex-shrink-0">
        <Avatar className="w-12 h-12">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {name?.charAt(0)?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {/* Online indicator */}
        {isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
        )}
        
        {/* Priority indicator */}
        {priority !== 'MEDIUM' && (
          <div className={cn(
            'absolute -top-1 -left-1 w-3 h-3 rounded-full border-2 border-background',
            getPriorityColor(priority)
          )} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-medium text-sm truncate">
              {name}
            </h3>
            <span className="text-xs opacity-60">
              {getSourceIcon(source)}
            </span>
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            {lastMessageAt && (
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(lastMessageAt), { addSuffix: true })}
              </span>
            )}
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
        </div>

        {/* Last message */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {lastMessage}
        </p>

        {/* Status and actions row */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {/* Status indicator */}
          {showAIIndicator && (
            <ChatStatusIndicator
              isAIHandled={isAIHandled}
              assignedAgent={assignedAgent}
              aiEnabled={aiEnabled}
              size="xs"
            />
          )}
          
          {/* Take over button */}
          {showTakeOverButton && !isActive && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <ChatAssignmentButton
                chatId={chatId}
                conversationId={conversationId || id}
                isAssigned={isAssignedToMe}
                assignedAgent={assignedAgent}
                onTakeOver={handleTakeOver}
                size="xs"
                variant="outline"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatListItem
