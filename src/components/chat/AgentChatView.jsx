'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User, Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WidgetMessage } from '@/components/widget/WidgetMessage';
import { TypingIndicator, useTypingIndicator } from '@/components/realtime/TypingIndicator';
import { useRealtime } from '@/context/realtimeContext';
import { useMessages } from '@/hooks/useMessages';

/**
 * Agent Chat View Component
 * Displays the full conversation with chat bubbles similar to the widget
 */
export const AgentChatView = ({
  conversation,
  messages: propMessages = [],
  onSendMessage,
  onTakeConversation,
  isLoading: propIsLoading = false,
  className,
  ...props
}) => {
  const scrollAreaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  const { subscribeToMessages } = useRealtime();
  const { startTyping } = useTypingIndicator(conversation?.chatId || conversation?.id);

  // Use real-time messages hook with the correct chat ID
  const {
    messages: realtimeMessages,
    isLoading: messagesLoading,
    sendMessage,
    markMessagesAsRead
  } = useMessages(conversation?.chatId || conversation?.id, {
    useRealtime: true,
    autoMarkAsRead: true
  });

  // Use real-time messages if available, otherwise fall back to prop messages
  const messages = realtimeMessages.length > 0 ? realtimeMessages : propMessages;
  const isLoading = propIsLoading || messagesLoading;

  // Theme configuration for message display
  const theme = {
    primaryColor: '#3b82f6',
    textColor: '#1f2937',
    backgroundColor: '#ffffff'
  };

  // Scroll to bottom function using scroll anchor (like widget)
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end'
    });
  }, []);

  // Handle scroll position detection
  const handleScroll = useCallback(() => {
    if (scrollAreaRef.current) {
      // Get the viewport element from ScrollArea
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        const { scrollTop, scrollHeight, clientHeight } = viewport;
        const threshold = 50;
        const atBottom = scrollHeight - scrollTop - clientHeight <= threshold;

        if (atBottom !== isAtBottom) {
          setIsAtBottom(atBottom);
          if (atBottom) {
            setUnreadCount(0);
          }
        }
      }
    }
  }, [isAtBottom]);

  // Handle sending messages
  const handleSendMessage = useCallback(async (messageText) => {
    const chatId = conversation?.chatId || conversation?.id;
    if (!messageText.trim() || !chatId) return;

    try {
      // Use the real-time sendMessage function if available
      if (sendMessage) {
        await sendMessage(messageText);
      } else if (onSendMessage) {
        // Fall back to prop function
        onSendMessage(messageText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [conversation?.chatId, conversation?.id, sendMessage, onSendMessage]);

  // Note: Typing indicators are automatically handled by the real-time context
  // The TypingIndicator component will receive updates through useRealtime() hook

  // Auto-scroll to bottom when conversation loads initially
  useEffect(() => {
    if (conversation?.chatId && messages.length > 0 && !isLoading) {
      setIsAtBottom(true);
      setTimeout(() => scrollToBottom(false), 100); // No smooth scroll on initial load
    }
  }, [conversation?.chatId, scrollToBottom, isLoading]);

  // Handle new messages and auto-scroll
  useEffect(() => {
    if (messages.length > previousMessageCount && previousMessageCount > 0) {
      // New message(s) arrived
      if (isAtBottom) {
        // User is at bottom, auto-scroll to new message
        setTimeout(() => scrollToBottom(true), 100);
      } else {
        // User is not at bottom, increment unread count
        const newMessageCount = messages.length - previousMessageCount;
        setUnreadCount(prev => prev + newMessageCount);
      }
    }
    setPreviousMessageCount(messages.length);
  }, [messages.length, previousMessageCount, isAtBottom, scrollToBottom]);

  // Auto-scroll when user is at bottom and messages change
  useEffect(() => {
    if (isAtBottom && messages.length > 0) {
      setTimeout(() => scrollToBottom(true), 100);
    }
  }, [messages, isAtBottom, scrollToBottom]);

  // Set up scroll event listener
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
      const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.addEventListener('scroll', handleScroll);
        return () => {
          viewport.removeEventListener('scroll', handleScroll);
        };
      }
    }
  }, [handleScroll]);

  // Format conversation status
  const getStatusBadge = () => {
    if (!conversation) return null;

    switch (conversation.status) {
      case 'UNATTENDED':
        return <Badge variant="destructive">Unattended</Badge>;
      case 'ACTIVE':
        return <Badge variant="default">Active</Badge>;
      case 'RESOLVED':
        return <Badge variant="secondary">Resolved</Badge>;
      default:
        return null;
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Format wait time
  const formatWaitTime = (createdAt) => {
    if (!createdAt) return '';
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ${diffHours % 24}h`;
  };

  if (!conversation) {
    return (
      <div className={cn('flex items-center justify-center h-full p-8', className)}>
        <div className="text-center text-muted-foreground">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Conversation Selected</h3>
          <p className="text-sm">Select a conversation to view the chat history</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)} {...props}>
      {/* Conversation Header */}
      <div className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Customer Avatar */}
            <Avatar className="h-10 w-10">
              <AvatarImage src={conversation.customer?.avatar} alt={conversation.customer?.name} />
              <AvatarFallback>
                {conversation.customer?.name?.charAt(0)?.toUpperCase() || <User className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>

            {/* Customer Info */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{conversation.customer?.name || 'Anonymous Customer'}</h3>
                {getStatusBadge()}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Waiting for {formatWaitTime(conversation.createdAt)}</span>
                <div className={`w-2 h-2 rounded-full ${getPriorityColor(conversation.priority)}`} />
                <span className="capitalize">{conversation.priority || 'normal'} priority</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {conversation.status === 'UNATTENDED' && onTakeConversation && (
            <Button onClick={onTakeConversation} size="sm">
              Take Conversation
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea
          ref={scrollAreaRef}
          className="h-full"
        >
          <div className="p-4 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center text-muted-foreground">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm">Loading conversation...</p>
                </div>
              </div>
            ) : messages.length > 0 ? (
              <>
                {messages.map((message, index) => (
                  <WidgetMessage
                    key={message.id || index}
                    message={message}
                    theme={theme}
                    showAvatar={true}
                    className="max-w-none"
                  />
                ))}
                
                {/* Typing Indicator */}
                <TypingIndicator
                  chatId={conversation.chatId || conversation.id}
                  showAvatars={true}
                  maxVisible={3}
                  customerInfo={conversation.customer}
                />

                {/* Scroll anchor */}
                <div ref={messagesEndRef} className="h-1" />
              </>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center text-muted-foreground">
                  <p className="text-sm">No messages yet</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* New Messages Indicator */}
        {unreadCount > 0 && !isAtBottom && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 animate-in slide-in-from-bottom-2 duration-300">
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                scrollToBottom(true);
                setUnreadCount(0);
                setIsAtBottom(true);
              }}
              className="shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-4 py-2 flex items-center gap-2 animate-pulse"
            >
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
              {unreadCount} new message{unreadCount > 1 ? 's' : ''}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentChatView;
