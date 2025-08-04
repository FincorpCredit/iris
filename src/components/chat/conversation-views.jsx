'use client'

import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Import the existing ConversationItem component
import { ConversationItem } from './chat-sidebar'

// Mine conversations - assigned to current user
export const MineConversations = ({ 
  conversations, 
  activeConversationId, 
  onConversationSelect,
  className 
}) => {
  const myConversations = conversations.filter(conv => conv.assignedToMe === true)

  if (myConversations.length === 0) {
    return (
      <div className={cn("flex-1 flex items-center justify-center p-8", className)}>
        <div className="text-center text-muted-foreground">
          <div className="text-lg font-medium mb-2">No conversations assigned</div>
          <div className="text-sm">Conversations assigned to you will appear here</div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex-1 overflow-hidden", className)}>
      <ScrollArea className="h-full">
        <div className="space-y-1 p-2">
          {myConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              {...conversation}
              isActive={activeConversationId === conversation.id}
              onClick={onConversationSelect}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

// Unassigned conversations - not assigned to anyone
export const UnassignedConversations = ({ 
  conversations, 
  activeConversationId, 
  onConversationSelect,
  className 
}) => {
  const unassignedConversations = conversations.filter(conv => 
    !conv.assignedToMe && !conv.assignedToOther
  )

  if (unassignedConversations.length === 0) {
    return (
      <div className={cn("flex-1 flex items-center justify-center p-8", className)}>
        <div className="text-center text-muted-foreground">
          <div className="text-lg font-medium mb-2">No unassigned conversations</div>
          <div className="text-sm">Unassigned conversations will appear here</div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex-1 overflow-hidden", className)}>
      <ScrollArea className="h-full">
        <div className="space-y-1 p-2">
          {unassignedConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              {...conversation}
              isActive={activeConversationId === conversation.id}
              onClick={onConversationSelect}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

// All conversations - complete list
export const AllConversations = ({ 
  conversations, 
  activeConversationId, 
  onConversationSelect,
  className 
}) => {
  if (conversations.length === 0) {
    return (
      <div className={cn("flex-1 flex items-center justify-center p-8", className)}>
        <div className="text-center text-muted-foreground">
          <div className="text-lg font-medium mb-2">No conversations</div>
          <div className="text-sm">Start a new conversation to get started</div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex-1 overflow-hidden", className)}>
      <ScrollArea className="h-full">
        <div className="space-y-1 p-2">
          {conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              {...conversation}
              isActive={activeConversationId === conversation.id}
              onClick={onConversationSelect}
            />
          ))}
        </div>
      </ScrollArea>
      
      {/* Stats footer */}
      <div className="p-4 border-t border-border bg-muted/20 flex-shrink-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{conversations.length} conversations</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                {conversations.filter(c => c.assignedToMe).length}
              </Badge>
              mine
            </span>
            <span className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                {conversations.filter(c => !c.assignedToMe && !c.assignedToOther).length}
              </Badge>
              unassigned
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Conversation view renderer based on active tab
export const ConversationView = ({ 
  activeTab, 
  conversations, 
  activeConversationId, 
  onConversationSelect,
  className 
}) => {
  switch (activeTab) {
    case 'mine':
      return (
        <MineConversations
          conversations={conversations}
          activeConversationId={activeConversationId}
          onConversationSelect={onConversationSelect}
          className={className}
        />
      )
    case 'unassigned':
      return (
        <UnassignedConversations
          conversations={conversations}
          activeConversationId={activeConversationId}
          onConversationSelect={onConversationSelect}
          className={className}
        />
      )
    case 'all':
    default:
      return (
        <AllConversations
          conversations={conversations}
          activeConversationId={activeConversationId}
          onConversationSelect={onConversationSelect}
          className={className}
        />
      )
  }
}
