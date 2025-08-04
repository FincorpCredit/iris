'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OnlineIndicator, AgentTypeBadge } from '@/components/common/status-indicator'
import Tabs from '@/components/common/tabs'
import { ConversationView } from './conversation-views'

// Search bar component
const SearchBar = ({ placeholder = "Search chats...", value, onChange, className }) => {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
      />
    </div>
  )
}

// Individual conversation item
const ConversationItem = ({
  id,
  avatar,
  name,
  lastMessage,
  timestamp,
  unreadCount = 0,
  isOnline = false,
  agentType = 'human',
  isActive = false,
  onClick,
  className
}) => {
  const formatTimestamp = (timestamp) => {
    const now = new Date()
    const messageTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'now'
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  return (
    <div
      onClick={() => onClick?.(id)}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-muted/40',
        isActive && 'bg-muted/60 border border-border/50',
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
        <OnlineIndicator 
          isOnline={isOnline} 
          agentType={agentType} 
          size="small"
          className="absolute -bottom-0.5 -right-0.5"
        />
        <AgentTypeBadge type={agentType} />
      </div>

      {/* Conversation details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium text-sm truncate text-foreground">
            {name}
          </h4>
          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
            {formatTimestamp(timestamp)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground truncate leading-normal">
          {lastMessage}
        </p>
      </div>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <Badge variant="destructive" className="text-xs min-w-0 px-2 flex-shrink-0">
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </div>
  )
}

// Conversation list component
const ConversationList = ({ conversations, activeConversationId, onConversationSelect, className }) => {
  return (
    <ScrollArea className={cn("flex-1", className)}>
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
  )
}

// Main chat sidebar component
const ChatSidebar = ({
  conversations = [],
  activeConversationId,
  onConversationSelect,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const tabs = [
    {
      value: 'mine',
      label: 'Mine',
      badge: conversations.filter(conv => conv.assignedToMe === true).length,
    },
    {
      value: 'unassigned',
      label: 'Unassigned',
      badge: conversations.filter(conv => !conv.assignedToMe && !conv.assignedToOther).length,
    },
    {
      value: 'all',
      label: 'All',
      badge: conversations.length,
    },
  ]

  return (
    <div className={cn("flex flex-col h-full bg-background border-r border-border", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <h2 className="text-lg font-semibold mb-3">Messages</h2>
        <SearchBar
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="px-4 py-2 border-b border-border">
        <Tabs
          tabs={tabs}
          defaultValue={activeTab}
          onValueChange={setActiveTab}
          size="sm"
          tabsClassName="w-full"
        />
      </div>

      {/* Conversation list */}
      <ConversationView
        activeTab={activeTab}
        conversations={filteredConversations}
        activeConversationId={activeConversationId}
        onConversationSelect={onConversationSelect}
      />
    </div>
  )
}

export default ChatSidebar
export { SearchBar, ConversationItem, ConversationList }