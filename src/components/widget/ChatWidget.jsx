'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, MessageCircle, Send, Paperclip, Smile, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { WidgetMessage } from './WidgetMessage';
import { WidgetTypingIndicator } from './WidgetTypingIndicator';
import { CustomerForm } from './CustomerForm';
import { useWidgetChat } from './hooks/useWidgetChat';

/**
 * Main Chat Widget Component
 * Embeddable chat widget for customer-facing websites
 */
export const ChatWidget = ({
  position = 'bottom-right',
  theme = {},
  apiUrl = '/api/widget',
  widgetName = 'default',
  className,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const {
    session,
    messages,
    isLoading,
    isConnected,
    typingIndicators,
    settings,
    error,
    sendMessage,
    startSession,
    endSession,
    setTyping,
    markMessagesAsRead
  } = useWidgetChat(apiUrl, widgetName);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isOpen, scrollToBottom]);

  // Handle customer form submission
  const handleCustomerSubmit = async (customerData) => {
    try {
      await startSession(customerData);
      setShowCustomerForm(false);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  // Handle message sending
  const handleSendMessage = async (content) => {
    if (!content.trim() || isLoading) return;

    try {
      await sendMessage(content);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Handle typing indicators
  const handleTyping = useCallback(
    (isTyping) => {
      setTyping(isTyping);
    },
    [setTyping]
  );

  // Widget positioning styles
  const getPositionStyles = () => {
    const baseStyles = 'fixed z-50';
    switch (position) {
      case 'bottom-left':
        return `${baseStyles} bottom-4 left-4`;
      case 'bottom-right':
        return `${baseStyles} bottom-4 right-4`;
      case 'top-left':
        return `${baseStyles} top-4 left-4`;
      case 'top-right':
        return `${baseStyles} top-4 right-4`;
      default:
        return `${baseStyles} bottom-4 right-4`;
    }
  };

  // Apply custom theme
  const widgetTheme = {
    primaryColor: '#3b82f6',
    textColor: '#1f2937',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    fontFamily: 'Inter, sans-serif',
    ...theme,
    ...settings?.theme
  };

  // Don't render if widget is disabled
  if (settings && !settings.isEnabled) {
    return null;
  }

  return (
    <div className={cn(getPositionStyles(), className)} style={{ fontFamily: widgetTheme.fontFamily }}>
      {/* Chat Button (when closed) */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
          style={{
            backgroundColor: widgetTheme.primaryColor,
            color: widgetTheme.backgroundColor
          }}
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
          {/* Unread message indicator */}
          {messages.some(msg => !msg.isRead && msg.senderType !== 'CUSTOMER') && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              style={{ backgroundColor: '#ef4444', color: 'white' }}
            >
              !
            </Badge>
          )}
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={cn(
            'bg-white shadow-2xl border border-gray-200 flex flex-col transition-all duration-200',
            isMinimized ? 'h-14' : 'h-[450px] md:h-[500px]'
          )}
          style={{
            width: '360px',
            maxWidth: '95vw',
            backgroundColor: widgetTheme.backgroundColor,
            borderRadius: widgetTheme.borderRadius,
            color: widgetTheme.textColor
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 border-b"
            style={{
              backgroundColor: widgetTheme.primaryColor,
              color: widgetTheme.backgroundColor,
              borderTopLeftRadius: widgetTheme.borderRadius,
              borderTopRightRadius: widgetTheme.borderRadius
            }}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/iris-avatar.svg" alt="Iris" />
                <AvatarFallback style={{ backgroundColor: widgetTheme.backgroundColor, color: widgetTheme.primaryColor }}>
                  AI
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm">Iris Assistant</h3>
                <p className="text-xs opacity-90">
                  {isConnected ? 'Online' : 'Connecting...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 p-0 hover:bg-white/20"
                style={{ color: widgetTheme.backgroundColor }}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  if (session) {
                    endSession();
                  }
                }}
                className="h-8 w-8 p-0 hover:bg-white/20"
                style={{ color: widgetTheme.backgroundColor }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <>
              {/* Customer Form or Chat Messages */}
              {showCustomerForm && !session ? (
                <CustomerForm
                  onSubmit={handleCustomerSubmit}
                  settings={settings}
                  theme={widgetTheme}
                  isLoading={isLoading}
                />
              ) : (
                <>
                  {/* Messages Area */}
                  <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full chat-scroll">
                      <div className="p-4 space-y-3 min-h-full">
                        {/* Welcome Message */}
                        {messages.length === 0 && settings?.currentMessage && (
                          <WidgetMessage
                            message={{
                              id: 'welcome',
                              content: settings.currentMessage,
                              senderType: 'AI',
                              isFromAI: true,
                              createdAt: new Date().toISOString()
                            }}
                            theme={widgetTheme}
                            showAvatar={settings?.showAgentPhotos}
                          />
                        )}

                        {/* Chat Messages */}
                        {messages.map((message) => (
                          <WidgetMessage
                            key={message.id}
                            message={message}
                            theme={widgetTheme}
                            showAvatar={settings?.showAgentPhotos}
                          />
                        ))}

                        {/* Typing Indicator */}
                        {typingIndicators.length > 0 && settings?.showTypingIndicator && (
                          <WidgetTypingIndicator
                            indicators={typingIndicators}
                            theme={widgetTheme}
                          />
                        )}

                        {/* Error Message */}
                        {error && (
                          <div className="text-center text-sm text-red-500 bg-red-50 p-3 rounded mx-2">
                            {error}
                          </div>
                        )}

                        {/* Scroll anchor */}
                        <div ref={messagesEndRef} className="h-1" />
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Input Area */}
                  <WidgetInput
                    onSendMessage={handleSendMessage}
                    onTyping={handleTyping}
                    isLoading={isLoading}
                    theme={widgetTheme}
                    settings={settings}
                    ref={inputRef}
                  />
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Widget Input Component
 */
const WidgetInput = React.forwardRef(({
  onSendMessage,
  onTyping,
  isLoading,
  theme,
  settings,
  ...props
}, ref) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    // Handle typing indicators
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      onTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping(false);
    }, 1000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
      setIsTyping(false);
      onTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t bg-white" style={{ backgroundColor: theme.backgroundColor }}>
      <form onSubmit={handleSubmit} className="p-3">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative min-w-0">
            <Textarea
              ref={ref}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-[40px] max-h-[100px] resize-none pr-16 text-sm"
              disabled={isLoading}
              style={{
                borderColor: theme.primaryColor + '40',
                focusBorderColor: theme.primaryColor
              }}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              {settings?.enableEmojis && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                  disabled={isLoading}
                >
                  <Smile className="h-3 w-3" />
                </Button>
              )}
              {settings?.enableFileUpload && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                  disabled={isLoading}
                >
                  <Paperclip className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          <Button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="h-10 w-10 p-0 flex-shrink-0 transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: theme.primaryColor,
              color: theme.backgroundColor
            }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
});

WidgetInput.displayName = 'WidgetInput';

export default ChatWidget;
