'use client'

import React, { useState, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Menu, AlertCircle, Clock } from 'lucide-react'
import ChatSidebar from '@/components/chat/chat-sidebar'
import ChatHeader from '@/components/chat/chat-header'
import MessageBubble from '@/components/chat/message-bubble'
import ChatInput from '@/components/chat/chat-input'
import ResizableSidebar from '@/components/chat/resizable-sidebar'
import MobileNavButton from '@/components/layout/mobile-nav-button'
import { AGENT_TYPES } from '@/components/chat/agent-type'
import { Badge } from '@/components/ui/badge'

// Sample unattended conversations
const unattendedConversations = [
  {
    id: '1',
    name: 'Customer Support Request',
    avatar: null,
    lastMessage: 'I need help with my account setup. Can someone assist me?',
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    unreadCount: 3,
    isOnline: true,
    agentType: AGENT_TYPES.AI,
    assignedToMe: false,
    assignedToOther: false,
    priority: 'high',
    waitTime: '45m'
  },
  {
    id: '2',
    name: 'Billing Inquiry',
    avatar: null,
    lastMessage: 'I was charged twice for my subscription. Please help.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    unreadCount: 1,
    isOnline: false,
    agentType: AGENT_TYPES.AI,
    assignedToMe: false,
    assignedToOther: false,
    priority: 'medium',
    waitTime: '2h'
  },
  {
    id: '3',
    name: 'Technical Issue',
    avatar: null,
    lastMessage: 'The app keeps crashing when I try to upload files.',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    unreadCount: 2,
    isOnline: true,
    agentType: AGENT_TYPES.AI,
    assignedToMe: false,
    assignedToOther: false,
    priority: 'low',
    waitTime: '4h'
  }
]

const UnattendedPage = () => {
  const [activeConversationId, setActiveConversationId] = useState('1')
  const [isRecording, setIsRecording] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const scrollAreaRef = useRef(null)

  // Get active conversation and agent details
  const activeConversation = unattendedConversations.find(c => c.id === activeConversationId)
  
  const agent = activeConversation ? {
    name: activeConversation.name,
    avatar: activeConversation.avatar,
    isOnline: activeConversation.isOnline,
    agentType: activeConversation.agentType,
    department: 'Unassigned'
  } : null

  // Handle conversation selection
  const handleConversationSelect = (conversationId) => {
    setActiveConversationId(conversationId)
    setIsMobileSidebarOpen(false)
  }

  // Handle taking ownership of conversation
  const handleTakeConversation = () => {
    console.log('Taking ownership of conversation:', activeConversationId)
    // Here you would update the conversation to be assigned to the current user
  }

  // Handle sending messages
  const handleSendMessage = (messageText) => {
    if (!messageText.trim() || !activeConversationId) return
    console.log('Sending message:', messageText)
  }

  // Handle file attachments
  const handleFileSelect = (files) => {
    console.log('Files selected:', files)
  }

  // Handle voice recording
  const handleStartRecording = () => {
    setIsRecording(true)
  }

  const handleStopRecording = () => {
    setIsRecording(false)
  }

  // Handle header actions
  const handleCall = () => console.log('Initiating voice call')
  const handleVideoCall = () => console.log('Initiating video call')
  const handleInfo = () => console.log('Opening chat info')
  const handleMore = () => console.log('Opening more options')

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="flex w-full">
      {/* Desktop Resizable Sidebar */}
      <ResizableSidebar defaultWidth={320} minWidth={280} maxWidth={500}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold">Unattended</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Conversations waiting for agent assignment
            </p>
          </div>
          
          {/* Conversations list */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-1 p-2">
                {unattendedConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationSelect(conversation.id)}
                    className={`p-3 cursor-pointer transition-colors border-l-4 ${
                      activeConversationId === conversation.id
                        ? 'bg-accent text-accent-foreground border-l-primary'
                        : 'hover:bg-muted/50 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{conversation.name}</span>
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(conversation.priority)}`} />
                        </div>
                        <p className="text-sm text-muted-foreground truncate mb-2">
                          {conversation.lastMessage}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {conversation.waitTime}
                            </span>
                          </div>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Stats footer */}
          <div className="p-4 border-t border-border bg-muted/20 flex-shrink-0">
            <div className="text-sm text-muted-foreground text-center">
              <div className="font-medium">{unattendedConversations.length} unattended</div>
              <div className="text-xs mt-1">
                {unattendedConversations.filter(c => c.priority === 'high').length} high priority
              </div>
            </div>
          </div>
        </div>
      </ResizableSidebar>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetTitle className="sr-only">Unattended Conversations</SheetTitle>
          {/* Mobile content would go here */}
        </SheetContent>
      </Sheet>
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Header with mobile menu buttons */}
        <div className="flex items-center border-b border-border bg-background">
          {/* Mobile navigation button */}
          <MobileNavButton />

          {/* Mobile chat sidebar button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="m-2"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Chat header with take conversation button */}
          <div className="flex-1 flex items-center">
            <div className="flex-1">
              <ChatHeader
                agent={agent}
                onCall={handleCall}
                onVideoCall={handleVideoCall}
                onInfo={handleInfo}
                onMore={handleMore}
                className="border-0"
              />
            </div>
            {activeConversation && (
              <div className="px-4">
                <Button 
                  onClick={handleTakeConversation}
                  className="bg-primary hover:bg-primary/90"
                >
                  Take Conversation
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Messages or empty state */}
        <div className="flex-1 overflow-hidden">
          {activeConversation ? (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center text-muted-foreground max-w-md">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                <h3 className="text-lg font-medium mb-2">Unattended Conversation</h3>
                <p className="text-sm mb-4">
                  This conversation has been waiting for {activeConversation.waitTime}. 
                  Take ownership to start helping the customer.
                </p>
                <div className="flex items-center justify-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${getPriorityColor(activeConversation.priority)}`} />
                  <span className="capitalize">{activeConversation.priority} priority</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Conversation Selected</h3>
                <p className="text-sm">Select an unattended conversation to view details</p>
              </div>
            </div>
          )}
        </div>

        {/* Input - only show if conversation is taken */}
        {activeConversation && (
          <div className="border-t border-border bg-muted/20 p-4">
            <div className="text-center text-sm text-muted-foreground">
              Take ownership of this conversation to start messaging
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UnattendedPage
