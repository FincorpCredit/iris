'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlus, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

/**
 * ChatAssignmentButton - Button for agents to take over AI conversations
 */
export const ChatAssignmentButton = ({ 
  chatId,
  conversationId,
  isAssigned = false,
  assignedAgent = null,
  onTakeOver,
  className = '',
  size = 'sm',
  variant = 'outline'
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleTakeOver = async () => {
    if (isLoading || isAssigned) return

    setIsLoading(true)
    try {
      await onTakeOver?.(chatId, conversationId)
      
      toast({
        title: "Conversation assigned",
        description: "You are now handling this conversation",
        variant: "success"
      })
    } catch (error) {
      console.error('Failed to take over conversation:', error)
      toast({
        title: "Assignment failed",
        description: "Could not assign conversation. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sizeClasses = {
    xs: 'h-6 px-2 text-xs',
    sm: 'h-8 px-3 text-sm',
    md: 'h-9 px-4 text-sm',
    lg: 'h-10 px-6 text-base'
  }

  // Already assigned to current user
  if (isAssigned) {
    return (
      <Button
        variant="secondary"
        size={size}
        disabled
        className={cn(
          'bg-green-50 text-green-700 border-green-200 hover:bg-green-50 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
          sizeClasses[size],
          className
        )}
      >
        <Check className="w-3 h-3 mr-1" />
        Assigned to you
      </Button>
    )
  }

  // Assigned to another agent
  if (assignedAgent) {
    return (
      <Button
        variant="outline"
        size={size}
        disabled
        className={cn(
          'text-muted-foreground cursor-not-allowed',
          sizeClasses[size],
          className
        )}
      >
        Assigned to {assignedAgent.name}
      </Button>
    )
  }

  // Available to take over
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleTakeOver}
      disabled={isLoading}
      className={cn(
        'hover:bg-primary hover:text-primary-foreground transition-colors',
        sizeClasses[size],
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
      ) : (
        <UserPlus className="w-3 h-3 mr-1" />
      )}
      {isLoading ? 'Taking over...' : 'Take Over'}
    </Button>
  )
}

export default ChatAssignmentButton
