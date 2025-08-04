'use client'

import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MoreVertical, Phone, Video, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OnlineIndicator, AgentStatus, AgentTypeBadge } from '@/components/common/status-indicator'

// Agent avatar with status indicators
const AgentAvatar = ({ 
  src, 
  name, 
  isOnline, 
  agentType, 
  size = 'medium',
  className 
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-12 h-12'
  }

  return (
    <div className={cn('relative', className)}>
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={src} alt={name} />
        <AvatarFallback className="bg-primary/10 text-primary font-medium">
          {name?.charAt(0)?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <OnlineIndicator 
        isOnline={isOnline} 
        agentType={agentType} 
        size="small"
        className="absolute -bottom-0.5 -right-0.5"
      />
      <AgentTypeBadge type={agentType} />
    </div>
  )
}

// Agent information section
const AgentInfo = ({ 
  name, 
  type, 
  isOnline, 
  department,
  className 
}) => {
  return (
    <div className={cn('flex-1 min-w-0', className)}>
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-semibold text-foreground truncate">
          {name}
        </h3>
        {department && (
          <Badge variant="outline" className="text-xs">
            {department}
          </Badge>
        )}
      </div>
      <AgentStatus 
        type={type} 
        isOnline={isOnline} 
        showTypeIcon={false}
        className="text-xs"
      />
    </div>
  )
}

// Chat header actions
const ChatHeaderActions = ({ 
  onCall, 
  onVideoCall, 
  onInfo, 
  onMore,
  agentType,
  className 
}) => {
  // AI agents don't support voice/video calls
  const showCallButtons = agentType === 'human'

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {showCallButtons && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCall}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Voice call"
          >
            <Phone className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onVideoCall}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Video call"
          >
            <Video className="w-4 h-4" />
          </Button>
        </>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={onInfo}
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        title="Chat info"
      >
        <Info className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onMore}
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        title="More options"
      >
        <MoreVertical className="w-4 h-4" />
      </Button>
    </div>
  )
}

// Main chat header component
const ChatHeader = ({ 
  agent,
  onCall,
  onVideoCall,
  onInfo,
  onMore,
  className 
}) => {
  if (!agent) {
    return (
      <div className={cn('flex items-center justify-center h-16 border-b border-border bg-background', className)}>
        <span className="text-muted-foreground">Select a conversation to start chatting</span>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-3 p-4 border-b border-border bg-background', className)}>
      <AgentAvatar
        src={agent.avatar}
        name={agent.name}
        isOnline={agent.isOnline}
        agentType={agent.type}
        size="medium"
      />
      
      <AgentInfo
        name={agent.name}
        type={agent.type}
        isOnline={agent.isOnline}
        department={agent.department}
      />

      <ChatHeaderActions
        onCall={onCall}
        onVideoCall={onVideoCall}
        onInfo={onInfo}
        onMore={onMore}
        agentType={agent.type}
      />
    </div>
  )
}

export default ChatHeader
export { AgentAvatar, AgentInfo, ChatHeaderActions }