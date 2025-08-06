'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Bot, User, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * ChatStatusIndicator - Shows whether a chat is AI-handled or agent-assigned
 */
export const ChatStatusIndicator = ({ 
  isAIHandled = false,
  assignedAgent = null,
  aiEnabled = true,
  className = '',
  size = 'sm'
}) => {
  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
    lg: 'text-base px-3 py-2'
  }

  // AI-handled conversation
  if (isAIHandled || (!assignedAgent && aiEnabled)) {
    return (
      <Badge 
        variant="secondary" 
        className={cn(
          'flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
          sizeClasses[size],
          className
        )}
      >
        <Bot className="w-3 h-3" />
        AI Active
      </Badge>
    )
  }

  // Agent-assigned conversation
  if (assignedAgent) {
    return (
      <Badge 
        variant="secondary" 
        className={cn(
          'flex items-center gap-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
          sizeClasses[size],
          className
        )}
      >
        <User className="w-3 h-3" />
        {assignedAgent.name || 'Agent'}
      </Badge>
    )
  }

  // Unassigned state
  return (
    <Badge 
      variant="outline" 
      className={cn(
        'flex items-center gap-1 text-muted-foreground',
        sizeClasses[size],
        className
      )}
    >
      <Users className="w-3 h-3" />
      Unassigned
    </Badge>
  )
}

/**
 * AIToggleIndicator - Shows current AI status in chat header
 */
export const AIToggleIndicator = ({ 
  aiEnabled = true,
  isAgent = false,
  className = ''
}) => {
  if (!isAgent) return null // Only show for agents

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1.5">
        <div className={cn(
          'w-2 h-2 rounded-full',
          aiEnabled ? 'bg-blue-500' : 'bg-gray-400'
        )} />
        <span className="text-sm text-muted-foreground">
          AI {aiEnabled ? 'Active' : 'Disabled'}
        </span>
      </div>
    </div>
  )
}

export default ChatStatusIndicator
