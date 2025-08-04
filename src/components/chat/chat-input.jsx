'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  Paperclip, 
  Smile, 
  Send, 
  Image, 
  FileText, 
  Mic,
  MicOff 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

// Attachment button with dropdown menu
const AttachmentButton = ({ onFileSelect, className }) => {
  const fileInputRef = useRef(null)

  const handleFileClick = (type) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/*' : '*'
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files)
    if (files.length > 0) {
      onFileSelect?.(files)
    }
    // Reset input
    event.target.value = ''
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8 text-muted-foreground hover:text-foreground', className)}
          title="Attach file"
        >
          <Paperclip className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => handleFileClick('image')}
          >
            <Image className="w-4 h-4 mr-2" />
            Photo or Video
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => handleFileClick('file')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Document
          </Button>
        </div>
      </PopoverContent>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </Popover>
  )
}

// Emoji button (placeholder for emoji picker)
const EmojiButton = ({ onEmojiSelect, className }) => {
  const commonEmojis = ['😊', '😂', '❤️', '👍', '👎', '😢', '😮', '😡']

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8 text-muted-foreground hover:text-foreground', className)}
          title="Add emoji"
        >
          <Smile className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="grid grid-cols-8 gap-1">
          {commonEmojis.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-base hover:bg-muted"
              onClick={() => onEmojiSelect?.(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Voice recording button
const VoiceButton = ({ 
  isRecording, 
  onStartRecording, 
  onStopRecording, 
  className 
}) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'h-8 w-8 text-muted-foreground hover:text-foreground',
        isRecording && 'text-red-500 hover:text-red-600',
        className
      )}
      onClick={isRecording ? onStopRecording : onStartRecording}
      title={isRecording ? 'Stop recording' : 'Record voice message'}
    >
      {isRecording ? (
        <MicOff className="w-4 h-4" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </Button>
  )
}

// Send button
const SendButton = ({ 
  onSend, 
  disabled = false, 
  isLoading = false,
  className 
}) => {
  return (
    <Button
      onClick={onSend}
      disabled={disabled || isLoading}
      size="icon"
      className={cn('h-8 w-8 flex-shrink-0', className)}
      title="Send message"
    >
      <Send className="w-4 h-4" />
    </Button>
  )
}

// Text input area
const TextInput = ({ 
  value, 
  onChange, 
  onKeyDown,
  placeholder = "Type a message...",
  disabled = false,
  className 
}) => {
  const handleKeyDown = (e) => {
    // Send on Enter, new line on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onKeyDown?.(e)
    }
  }

  return (
    <Textarea
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        'min-h-[40px] max-h-32 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-2',
        className
      )}
      rows={1}
    />
  )
}

// Main chat input component
const ChatInput = ({
  value = '',
  onChange,
  onSend,
  onFileSelect,
  onEmojiSelect,
  onStartRecording,
  onStopRecording,
  placeholder = "Describe your issue...",
  disabled = false,
  isLoading = false,
  isRecording = false,
  showVoiceButton = true,
  className
}) => {
  const [inputValue, setInputValue] = useState(value)

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange?.(newValue)
  }

  const handleSend = () => {
    if (inputValue.trim() && !disabled && !isLoading) {
      onSend?.(inputValue.trim())
      setInputValue('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSend()
    }
  }

  const handleEmojiSelect = (emoji) => {
    const newValue = inputValue + emoji
    setInputValue(newValue)
    onChange?.(newValue)
    onEmojiSelect?.(emoji)
  }

  const canSend = inputValue.trim().length > 0 && !disabled && !isLoading

  return (
    <div className={cn('border-t border-border bg-background p-4', className)}>
      <div className="flex items-end gap-2 bg-muted/20 rounded-xl border border-border p-3">
        {/* Left side controls */}
        <div className="flex items-center gap-1">
          <AttachmentButton onFileSelect={onFileSelect} />
          <EmojiButton onEmojiSelect={handleEmojiSelect} />
          {showVoiceButton && (
            <VoiceButton
              isRecording={isRecording}
              onStartRecording={onStartRecording}
              onStopRecording={onStopRecording}
            />
          )}
        </div>

        {/* Text input */}
        <TextInput
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1"
        />

        {/* Send button */}
        <SendButton
          onSend={handleSend}
          disabled={!canSend}
          isLoading={isLoading}
        />
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center gap-2 mt-2 text-sm text-red-600 dark:text-red-400">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Recording voice message...
        </div>
      )}
    </div>
  )
}

export default ChatInput
export { AttachmentButton, EmojiButton, VoiceButton, SendButton, TextInput }