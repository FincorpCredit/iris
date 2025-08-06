'use client'

import React, { useState, useEffect } from 'react'
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
  chatId,
  conversationId,
  avatar,
  name,
  lastMessage,
  timestamp,
  lastMessageAt,
  unreadCount = 0,
  isOnline = false,
  agentType = 'human',
  isActive = false,
  assignedAgentId = null,
  assignedAgent = null,
  aiEnabled = true,
  priority = 'MEDIUM',
  source = 'WIDGET',
  showAIIndicator = false,
  showTakeOverButton = false,
  isTyping = false,
  typingUser = null,
  onClick,
  onTakeOver,
  className
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute to refresh relative timestamps
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return ''
    const messageTime = new Date(timestamp)
    const diffInMinutes = Math.floor((currentTime - messageTime) / (1000 * 60))

    if (diffInMinutes < 1) return 'now'
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  const isAIHandled = !assignedAgentId
  const isAssignedToMe = assignedAgent?.isCurrentUser || false

  const handleTakeOver = async (chatId, conversationId) => {
    await onTakeOver?.(chatId, conversationId)
  }

  return (
    <div
      onClick={() => onClick?.(id)}
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
        <OnlineIndicator
          isOnline={isOnline}
          agentType={agentType}
          size="small"
          className="absolute -bottom-0.5 -right-0.5"
        />
        <AgentTypeBadge type={agentType} />
      </div>

      {/* Conversation details */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium text-sm truncate text-foreground">
            {name}
          </h4>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(lastMessageAt || timestamp)}
            </span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {isTyping && typingUser ? (
            <span className="text-blue-600 italic">
              {typingUser.userType === 'CUSTOMER' ? 'Customer' : 'Agent'} is typing...
            </span>
          ) : (
            lastMessage
          )}
        </p>

        {/* Status and actions row */}
        {(showAIIndicator || showTakeOverButton) && (
          <div className="flex items-center justify-between gap-2 pt-1">
            {showAIIndicator && (
              <div className="flex items-center gap-1">
                {isAIHandled ? (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
                    🤖 AI Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border-green-200">
                    👤 {assignedAgent?.name || 'Agent'}
                  </Badge>
                )}
              </div>
            )}

            {showTakeOverButton && !isActive && isAIHandled && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTakeOver(chatId, conversationId || id)
                  }}
                  className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                >
                  Take Over
                </button>
              </div>
            )}
          </div>
        )}
      </div>
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
  isLoading = false,
  error = null,
  activeConversationId,
  onConversationSelect,
  onRefresh,
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
      value: 'unattended',
      label: 'Unattended',
      badge: conversations.filter(conv => !conv.assignedAgentId).length, // AI-handled conversations
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
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <div className="text-sm">Loading conversations...</div>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-muted-foreground">
            <div className="text-lg font-medium mb-2 text-destructive">Error loading conversations</div>
            <div className="text-sm mb-4">{error}</div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="text-sm px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      ) : (
        <ConversationView
          activeTab={activeTab}
          conversations={filteredConversations}
          activeConversationId={activeConversationId}
          onConversationSelect={onConversationSelect}
        />
      )}
    </div>
  )
}

export default ChatSidebar
export { SearchBar, ConversationItem, ConversationList }