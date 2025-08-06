'use client'

import React, { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Bot, User, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

/**
 * ChatToggleSwitch - Toggle AI on/off for agent-assigned conversations
 */
export const ChatToggleSwitch = ({ 
  chatId,
  conversationId,
  aiEnabled = true,
  onToggle,
  disabled = false,
  className = '',
  showLabel = true,
  size = 'default'
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleToggle = async (enabled) => {
    if (isLoading || disabled) return

    setIsLoading(true)
    try {
      await onToggle?.(chatId, conversationId, enabled)
      
      toast({
        title: enabled ? "AI enabled" : "AI disabled",
        description: enabled 
          ? "AI will now assist with responses" 
          : "You are now handling responses manually",
        variant: "success"
      })
    } catch (error) {
      console.error('Failed to toggle AI:', error)
      toast({
        title: "Toggle failed",
        description: "Could not change AI status. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sizeClasses = {
    sm: 'data-[state=checked]:h-4 data-[state=unchecked]:h-4 w-7',
    default: 'data-[state=checked]:h-5 data-[state=unchecked]:h-5 w-9',
    lg: 'data-[state=checked]:h-6 data-[state=unchecked]:h-6 w-11'
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showLabel && (
        <div className="flex items-center gap-1.5">
          {aiEnabled ? (
            <Bot className="w-4 h-4 text-blue-600" />
          ) : (
            <User className="w-4 h-4 text-green-600" />
          )}
          <Label 
            htmlFor={`ai-toggle-${chatId}`}
            className="text-sm font-medium cursor-pointer"
          >
            {aiEnabled ? 'AI Active' : 'Manual Mode'}
          </Label>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        {isLoading && (
          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
        )}
        
        <Switch
          id={`ai-toggle-${chatId}`}
          checked={aiEnabled}
          onCheckedChange={handleToggle}
          disabled={disabled || isLoading}
          className={cn(sizeClasses[size])}
        />
      </div>
    </div>
  )
}

/**
 * CompactAIToggle - Minimal toggle for chat headers
 */
export const CompactAIToggle = ({ 
  chatId,
  conversationId,
  aiEnabled = true,
  onToggle,
  disabled = false,
  className = ''
}) => {
  return (
    <ChatToggleSwitch
      chatId={chatId}
      conversationId={conversationId}
      aiEnabled={aiEnabled}
      onToggle={onToggle}
      disabled={disabled}
      showLabel={false}
      size="sm"
      className={cn('justify-end', className)}
    />
  )
}

export default ChatToggleSwitch
