'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Bot, User } from 'lucide-react'

// Online status indicator with different colors for AI vs human
export const OnlineIndicator = ({ 
  isOnline, 
  agentType = 'human', 
  size = 'small',
  className 
}) => {
  const sizeClasses = {
    small: 'w-2 h-2',
    medium: 'w-3 h-3',
    large: 'w-4 h-4'
  }

  const getStatusColor = () => {
    if (!isOnline) return 'bg-gray-400 dark:bg-gray-600'
    return agentType === 'ai' ? 'bg-blue-500' : 'bg-green-500'
  }

  return (
    <div 
      className={cn(
        'rounded-full border-2 border-white dark:border-gray-800',
        sizeClasses[size],
        getStatusColor(),
        className
      )}
    />
  )
}

// Agent type indicator with icon and optional label
export const AgentTypeIndicator = ({ 
  type, 
  showLabel = false, 
  size = 'small',
  className 
}) => {
  const iconSizes = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-5 h-5'
  }

  const Icon = type === 'ai' ? Bot : User
  const label = type === 'ai' ? 'AI Assistant' : 'Support Agent'
  const colorClass = type === 'ai' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'

  if (showLabel) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <Icon className={cn(iconSizes[size], colorClass)} />
        <span className={cn('text-xs font-medium', colorClass)}>
          {label}
        </span>
      </div>
    )
  }

  return (
    <Icon className={cn(iconSizes[size], colorClass, className)} />
  )
}

// Agent type badge for avatars
export const AgentTypeBadge = ({ 
  type, 
  className 
}) => {
  const variant = type === 'ai' ? 'default' : 'secondary'
  const Icon = type === 'ai' ? Bot : User

  return (
    <Badge 
      variant={variant}
      className={cn(
        'absolute -bottom-1 -right-1 p-1 h-auto min-w-0 rounded-full',
        type === 'ai' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600',
        'text-white border-2 border-white dark:border-gray-800',
        className
      )}
    >
      <Icon className="w-2.5 h-2.5" />
    </Badge>
  )
}

// Agent status component combining online indicator and type
export const AgentStatus = ({ 
  type, 
  isOnline, 
  showTypeIcon = true,
  className 
}) => {
  const getStatusText = () => {
    if (type === 'ai') {
      return 'AI Assistant • Always Available'
    }
    return isOnline ? 'Support Agent • Online' : 'Support Agent'
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <OnlineIndicator isOnline={isOnline} agentType={type} />
      <span className="text-sm text-muted-foreground">
        {getStatusText()}
      </span>
      {showTypeIcon && (
        <AgentTypeIndicator type={type} size="small" />
      )}
    </div>
  )
}