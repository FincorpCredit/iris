'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import { useAuth } from '@/context/authContext'
import ChatSidebar from '@/components/chat/chat-sidebar'
import ChatHeader from '@/components/chat/chat-header'
import MessageBubble from '@/components/chat/message-bubble'
import ChatInput from '@/components/chat/chat-input'
import ResizableSidebar from '@/components/chat/resizable-sidebar'
import MobileNavButton from '@/components/layout/mobile-nav-button'
import { AGENT_TYPES } from '@/components/chat/agent-type'

// Sample conversation data
const sampleConversations = [
  {
    id: '1',
    name: 'AI Assistant',
    avatar: null,
    lastMessage: 'I can help you with account setup, billing questions, and technical support.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    unreadCount: 0,
    isOnline: true,
    agentType: AGENT_TYPES.AI,
    assignedToMe: true,
    assignedToOther: false
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    avatar: null,
    lastMessage: 'Let me check your account details and get back to you shortly.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    unreadCount: 2,
    isOnline: true,
    agentType: AGENT_TYPES.HUMAN,
    department: 'Technical Support',
    assignedToMe: true,
    assignedToOther: false
  },
  {
    id: '3',
    name: 'Mike Chen',
    avatar: null,
    lastMessage: 'Your billing issue has been resolved. Is there anything else I can help with?',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    unreadCount: 0,
    isOnline: false,
    agentType: AGENT_TYPES.HUMAN,
    department: 'Billing',
    assignedToMe: false,
    assignedToOther: true
  },
  {
    id: '4',
    name: 'AI Support Bot',
    avatar: null,
    lastMessage: 'I found 3 articles that might help with your question. Would you like me to share them?',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    unreadCount: 1,
    isOnline: true,
    agentType: AGENT_TYPES.AI,
    assignedToMe: false,
    assignedToOther: false
  },
  {
    id: '5',
    name: 'Customer Support',
    avatar: null,
    lastMessage: 'Thank you for contacting us. We will get back to you soon.',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    unreadCount: 3,
    isOnline: false,
    agentType: AGENT_TYPES.HUMAN,
    department: 'General Support',
    assignedToMe: false,
    assignedToOther: false
  }
]

// Sample messages for different conversations
const sampleMessages = {
  '1': [
    {
      id: 'm1',
      message: 'Hello! I need help with setting up my new account.',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      isOwn: true,
      senderName: 'You',
      status: 'read'
    },
    {
      id: 'm2',
      message: 'Hi there! I\'d be happy to help you set up your account. Let me guide you through the process step by step.',
      timestamp: new Date(Date.now() - 9 * 60 * 1000),
      isOwn: false,
      senderName: 'AI Assistant',
      agentType: AGENT_TYPES.AI
    },
    {
      id: 'm3',
      message: 'First, let\'s verify your email address. Can you please check your inbox for a verification email?',
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      isOwn: false,
      senderName: 'AI Assistant',
      agentType: AGENT_TYPES.AI
    },
    {
      id: 'm4',
      message: 'Yes, I found the email and clicked the verification link.',
      timestamp: new Date(Date.now() - 7 * 60 * 1000),
      isOwn: true,
      senderName: 'You',
      status: 'read'
    },
    {
      id: 'm5',
      message: 'Perfect! Your email is now verified. Next, let\'s set up your profile. You can add your personal information and preferences in the settings section.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      isOwn: false,
      senderName: 'AI Assistant',
      agentType: AGENT_TYPES.AI
    }
  ],
  '2': [
    {
      id: 'm6',
      message: 'I\'m having trouble accessing my dashboard. It keeps showing an error message.',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      isOwn: true,
      senderName: 'You',
      status: 'read'
    },
    {
      id: 'm7',
      message: 'I understand how frustrating that must be. Let me check your account details and get back to you shortly.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isOwn: false,
      senderName: 'Sarah Johnson',
      agentType: AGENT_TYPES.HUMAN
    },
    {
      id: 'm8',
      message: 'I\'ve identified the issue. There was a temporary server problem that affected some users. It should be resolved now. Can you please try accessing your dashboard again?',
      timestamp: new Date(Date.now() - 90 * 60 * 1000),
      isOwn: false,
      senderName: 'Sarah Johnson',
      agentType: AGENT_TYPES.HUMAN
    }
  ]
}

const ChatPage = () => {
  const { user } = useAuth()
  const [activeConversationId, setActiveConversationId] = useState('1')
  const [messages, setMessages] = useState(sampleMessages)
  const [isRecording, setIsRecording] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const scrollAreaRef = useRef(null)

  // Get active conversation and agent details
  const activeConversation = sampleConversations.find(c => c.id === activeConversationId)
  const activeMessages = messages[activeConversationId] || []
  
  const agent = activeConversation ? {
    name: activeConversation.name,
    avatar: activeConversation.avatar,
    isOnline: activeConversation.isOnline,
    agentType: activeConversation.agentType,
    department: activeConversation.department
  } : null

  // Handle scroll position detection
  const handleScroll = useCallback(() => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current
      const threshold = 50 // pixels from bottom
      const atBottom = scrollHeight - scrollTop - clientHeight <= threshold

      if (atBottom !== isAtBottom) {
        setIsAtBottom(atBottom)

        // If user scrolled to bottom, mark all messages as read
        if (atBottom) {
          setUnreadCount(0)
        }
      }
    }
  }, [isAtBottom, setIsAtBottom])

  // Scroll to bottom function
  const scrollToBottom = (smooth = false) => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current
      if (smooth) {
        scrollArea.scrollTo({
          top: scrollArea.scrollHeight,
          behavior: 'smooth'
        })
      } else {
        scrollArea.scrollTop = scrollArea.scrollHeight
      }
    }
  }

  // Handle conversation selection
  const handleConversationSelect = (conversationId) => {
    setActiveConversationId(conversationId)
    setUnreadCount(0)
    setIsAtBottom(true)
    setIsMobileSidebarOpen(false)
    
    // Scroll to bottom after conversation loads
    setTimeout(() => {
      scrollToBottom()
    }, 100)
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

    // Always scroll to bottom when user sends a message
    setTimeout(() => {
      scrollToBottom()
      setIsAtBottom(true)
      setUnreadCount(0)
    }, 100)

    // Simulate agent response
    setTimeout(() => {
      const agentResponse = {
        id: `m${Date.now()}_response`,
        message: activeConversation?.agentType === AGENT_TYPES.AI 
          ? "I understand your message. Let me help you with that right away!"
          : "Thank you for your message. I'm processing your request and will get back to you shortly.",
        timestamp: new Date(),
        isOwn: false,
        senderName: activeConversation?.name,
        agentType: activeConversation?.agentType
      }

      setMessages(prev => ({
        ...prev,
        [activeConversationId]: [...(prev[activeConversationId] || []), agentResponse]
      }))

      // If user is at bottom, auto-scroll to new message
      // If not at bottom, increment unread count
      setTimeout(() => {
        if (isAtBottom) {
          scrollToBottom()
        } else {
          setUnreadCount(prev => prev + 1)
        }
      }, 100)
    }, 1500)
  }

  // Handle file attachments
  const handleFileSelect = (files) => {
    console.log('Files selected:', files)
    // Handle file upload logic here
  }

  // Handle voice recording
  const handleStartRecording = () => {
    setIsRecording(true)
    console.log('Started recording')
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    console.log('Stopped recording')
    // Handle voice message logic here
  }



  // Handle header actions
  const handleCall = () => console.log('Initiating voice call')
  const handleVideoCall = () => console.log('Initiating video call')
  const handleInfo = () => console.log('Opening chat info')
  const handleMore = () => console.log('Opening more options')

  // Auto-scroll to bottom on initial load and conversation change
  useEffect(() => {
    setTimeout(() => {
      scrollToBottom()
    }, 100)
  }, [activeConversationId])

  useEffect(() => {
    const scrollArea = scrollAreaRef.current
    if (scrollArea) {
      scrollArea.addEventListener('scroll', handleScroll)
    }
    return () => {
      if (scrollArea) {
        scrollArea.removeEventListener('scroll', handleScroll)
      }
    }
  }, [handleScroll])

  // Check if user is authenticated
  if (!user) {
    return null // RouteGuard will handle redirect
  }

  return (
    <div className="flex w-full">
        {/* Desktop Resizable Sidebar */}
        <ResizableSidebar defaultWidth={320} minWidth={280} maxWidth={500}>
          <ChatSidebar
            conversations={sampleConversations}
            activeConversationId={activeConversationId}
            onConversationSelect={handleConversationSelect}
          />
        </ResizableSidebar>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetTitle className="sr-only">Conversations</SheetTitle>
          <ChatSidebar
            conversations={sampleConversations}
            activeConversationId={activeConversationId}
            onConversationSelect={handleConversationSelect}
          />
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
                  {index > 0 && activeMessages[index - 1].isOwn !== message.isOwn && (
                    <div className="flex justify-center mb-2">
                      <div className="text-xs text-gray-500">{message.senderName}</div>
                    </div>
                  )}
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
          placeholder={
            activeConversation?.agentType === AGENT_TYPES.AI 
              ? "Ask me anything..." 
              : "Describe your issue..."
          }
        />
      </div>
    </div>
  )
}

export default ChatPage