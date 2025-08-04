'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Menu, AtSign } from 'lucide-react'
import ChatSidebar from '@/components/chat/chat-sidebar'
import ChatHeader from '@/components/chat/chat-header'
import MessageBubble from '@/components/chat/message-bubble'
import ChatInput from '@/components/chat/chat-input'
import ResizableSidebar from '@/components/chat/resizable-sidebar'
import MobileNavButton from '@/components/layout/mobile-nav-button'
import { AGENT_TYPES } from '@/components/chat/agent-type'

// Sample conversations with mentions
const mentionConversations = [
  {
    id: '1',
    name: 'Sarah Johnson',
    avatar: null,
    lastMessage: '@you Can you help with this billing issue?',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    unreadCount: 1,
    isOnline: true,
    agentType: AGENT_TYPES.HUMAN,
    department: 'Technical Support',
    assignedToMe: true,
    assignedToOther: false
  },
  {
    id: '2',
    name: 'Mike Chen',
    avatar: null,
    lastMessage: '@you Please review this customer case',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    unreadCount: 2,
    isOnline: false,
    agentType: AGENT_TYPES.HUMAN,
    department: 'Billing',
    assignedToMe: false,
    assignedToOther: true
  },
  {
    id: '3',
    name: 'Team Discussion',
    avatar: null,
    lastMessage: '@you What do you think about this approach?',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    unreadCount: 0,
    isOnline: true,
    agentType: AGENT_TYPES.HUMAN,
    department: 'General Support',
    assignedToMe: true,
    assignedToOther: false
  }
]

// Sample messages for mentions
const mentionMessages = {
  '1': [
    {
      id: 'm1',
      message: '@you Can you help with this billing issue? The customer is asking about their recent charge.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      isOwn: false,
      senderName: 'Sarah Johnson',
      agentType: AGENT_TYPES.HUMAN
    }
  ]
}

const MentionsPage = () => {
  const [activeConversationId, setActiveConversationId] = useState('1')
  const [messages, setMessages] = useState(mentionMessages)
  const [isRecording, setIsRecording] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const scrollAreaRef = useRef(null)

  // Get active conversation and agent details
  const activeConversation = mentionConversations.find(c => c.id === activeConversationId)
  const activeMessages = messages[activeConversationId] || []
  
  const agent = activeConversation ? {
    name: activeConversation.name,
    avatar: activeConversation.avatar,
    isOnline: activeConversation.isOnline,
    agentType: activeConversation.agentType,
    department: activeConversation.department
  } : null

  // Handle conversation selection
  const handleConversationSelect = (conversationId) => {
    setActiveConversationId(conversationId)
    setIsAtBottom(true)
    setIsMobileSidebarOpen(false)
  }

  // Handle sending messages
  const handleSendMessage = (messageText) => {
    if (!messageText.trim() || !activeConversationId) return

    const newMessage = {
      id: `m${Date.now()}`,
      message: messageText,
      timestamp: new Date(),
      isOwn: true,
      senderName: 'You',
      status: 'sent'
    }

    setMessages(prev => ({
      ...prev,
      [activeConversationId]: [...(prev[activeConversationId] || []), newMessage]
    }))
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

  return (
    <div className="flex w-full">
      {/* Desktop Resizable Sidebar */}
      <ResizableSidebar defaultWidth={320} minWidth={280} maxWidth={500}>
        <div className="flex flex-col h-full">
          {/* Header with mentions icon */}
          <div className="p-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <AtSign className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Mentions</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Conversations where you've been mentioned
            </p>
          </div>
          
          {/* Conversations list */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-1 p-2">
                {mentionConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationSelect(conversation.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      activeConversationId === conversation.id
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{conversation.name}</span>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {conversation.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </ResizableSidebar>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetTitle className="sr-only">Mentions</SheetTitle>
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
          
          {/* Chat header */}
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
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea ref={scrollAreaRef} className="h-full p-4">
            <div className="space-y-4 pb-4">
              {activeMessages.map((message, index) => (
                <React.Fragment key={message.id}>
                  <MessageBubble
                    message={message.message}
                    timestamp={message.timestamp}
                    isOwn={message.isOwn}
                    senderName={message.senderName}
                    agentType={message.agentType}
                    status={message.status}
                  />
                </React.Fragment>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Input */}
        <ChatInput
          onSend={handleSendMessage}
          onFileSelect={handleFileSelect}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          isRecording={isRecording}
          placeholder="Reply to mention..."
        />
      </div>
    </div>
  )
}

export default MentionsPage
