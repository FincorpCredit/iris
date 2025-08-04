'use client'

import React from 'react'
import { Bot, User, Headphones, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Agent type constants
export const AGENT_TYPES = {
  AI: 'ai',
  HUMAN: 'human'
}

// Agent type configuration
export const AGENT_CONFIG = {
  [AGENT_TYPES.AI]: {
    label: 'AI Assistant',
    shortLabel: 'AI',
    icon: Bot,
    color: 'blue',
    statusText: 'Always Available',
    description: 'Powered by advanced AI to help you instantly',
    capabilities: ['24/7 Availability', 'Instant Responses', 'Multi-language Support']
  },
  [AGENT_TYPES.HUMAN]: {
    label: 'Support Agent',
    shortLabel: 'Agent',
    icon: User,
    color: 'green',
    statusText: 'Live Support',
    description: 'Real human agents for personalized assistance',
    capabilities: ['Personal Touch', 'Complex Problem Solving', 'Empathy & Understanding']
  }
}

// Get agent configuration
export const getAgentConfig = (type) => {
  return AGENT_CONFIG[type] || AGENT_CONFIG[AGENT_TYPES.HUMAN]
}

// Agent type display component
export const AgentTypeDisplay = ({ 
  type, 
  showIcon = true, 
  showLabel = true,
  size = 'default',
  className 
}) => {
  const config = getAgentConfig(type)
  const Icon = config.icon

  const sizeClasses = {
    sm: 'text-xs gap-1',
    default: 'text-sm gap-1.5',
    lg: 'text-base gap-2'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    default: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400'
  }

  return (
    <div className={cn(
      'flex items-center',
      sizeClasses[size],
      colorClasses[config.color],
      className
    )}>
      {showIcon && <Icon className={iconSizes[size]} />}
      {showLabel && <span className="font-medium">{config.label}</span>}
    </div>
  )
}

// Agent type badge component
export const AgentTypeBadge = ({ 
  type, 
  variant = 'default',
  className 
}) => {
  const config = getAgentConfig(type)
  const badgeVariant = type === AGENT_TYPES.AI ? 'default' : 'secondary'

  return (
    <Badge 
      variant={variant === 'default' ? badgeVariant : variant}
      className={cn(
        'text-xs font-medium',
        type === AGENT_TYPES.AI && 'bg-blue-500 hover:bg-blue-600 text-white',
        type === AGENT_TYPES.HUMAN && 'bg-green-500 hover:bg-green-600 text-white',
        className
      )}
    >
      {config.shortLabel}
    </Badge>
  )
}

// Agent capability list
export const AgentCapabilities = ({ 
  type, 
  className 
}) => {
  const config = getAgentConfig(type)

  return (
    <div className={cn('space-y-2', className)}>
      <h4 className="text-sm font-medium text-foreground">Capabilities:</h4>
      <ul className="space-y-1">
        {config.capabilities.map((capability, index) => (
          <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-1.5 h-1.5 bg-current rounded-full" />
            {capability}
          </li>
        ))}
      </ul>
    </div>
  )
}

// Agent selection component
export const AgentSelector = ({ 
  selectedType, 
  onTypeChange, 
  className 
}) => {
  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      {Object.values(AGENT_TYPES).map((type) => {
        const config = getAgentConfig(type)
        const Icon = config.icon
        const isSelected = selectedType === type

        return (
          <button
            key={type}
            onClick={() => onTypeChange(type)}
            className={cn(
              'flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all',
              'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              isSelected 
                ? 'border-primary bg-primary/5' 
                : 'border-border bg-background hover:border-primary/50'
            )}
          >
            <div className={cn(
              'p-3 rounded-full',
              type === AGENT_TYPES.AI ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30'
            )}>
              <Icon className={cn(
                'w-6 h-6',
                type === AGENT_TYPES.AI ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'
              )} />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-foreground mb-1">
                {config.label}
              </h3>
              <p className="text-xs text-muted-foreground">
                {config.description}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// Utility functions
export const isAIAgent = (type) => type === AGENT_TYPES.AI
export const isHumanAgent = (type) => type === AGENT_TYPES.HUMAN

export const getAgentStatusText = (type, isOnline) => {
  const config = getAgentConfig(type)
  if (type === AGENT_TYPES.AI) {
    return `${config.label} • ${config.statusText}`
  }
  return isOnline 
    ? `${config.label} • Online` 
    : config.label
}

export const getAgentAvailabilityText = (type, isOnline) => {
  if (type === AGENT_TYPES.AI) {
    return 'Available now'
  }
  return isOnline ? 'Available now' : 'Currently offline'
}