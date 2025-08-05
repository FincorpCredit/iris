'use client'

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Widget Typing Indicator Component
 * Shows when someone is typing in the chat
 */
export const WidgetTypingIndicator = ({
  indicators = [],
  theme,
  className,
  ...props
}) => {
  if (!indicators.length) return null;

  // Default theme values
  const safeTheme = {
    primaryColor: '#3b82f6',
    textColor: '#1f2937',
    backgroundColor: '#ffffff',
    ...theme
  };

  // Get the first typing indicator (usually there's only one)
  const indicator = indicators[0];
  const isAgent = indicator.userType === 'AGENT';
  const isAI = indicator.userType === 'AI';

  return (
    <div className={cn('flex gap-2 w-full justify-start', className)} {...props}>
      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
        {isAgent ? (
          <>
            <AvatarImage src={indicator.user?.profileImage} alt={indicator.user?.name || 'Agent'} />
            <AvatarFallback style={{ backgroundColor: safeTheme.primaryColor + '20', color: safeTheme.primaryColor }}>
              {indicator.user?.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
            </AvatarFallback>
          </>
        ) : (
          <AvatarFallback style={{ backgroundColor: safeTheme.primaryColor + '20', color: safeTheme.primaryColor }}>
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        )}
      </Avatar>

      {/* Typing Animation Container */}
      <div className="flex flex-col min-w-0 flex-1 max-w-[280px]">
        {/* Sender Name */}
        <div className="text-xs text-gray-500 mb-1 px-1 truncate">
          {isAgent ? indicator.user?.name || 'Agent' :
           isAI ? indicator.user?.name || 'Iris Assistant' :
           'Customer'} is typing...
        </div>

        {/* Typing Bubble */}
        <div
          className="rounded-lg rounded-bl-sm px-3 py-2 flex items-center gap-1 w-fit"
          style={{
            backgroundColor: safeTheme.backgroundColor === '#ffffff'
              ? '#f3f4f6'
              : safeTheme.backgroundColor + '80',
            border: `1px solid ${safeTheme.primaryColor}20`
          }}
        >
          <TypingDots theme={safeTheme} />
        </div>
      </div>
    </div>
  );
};

/**
 * Animated typing dots
 */
const TypingDots = ({ theme }) => {
  const safeTheme = {
    primaryColor: '#3b82f6',
    ...theme
  };

  return (
    <div className="flex items-center gap-1">
      <div
        className="w-2 h-2 rounded-full animate-bounce"
        style={{
          backgroundColor: safeTheme.primaryColor,
          animationDelay: '0ms',
          animationDuration: '1.4s'
        }}
      />
      <div
        className="w-2 h-2 rounded-full animate-bounce"
        style={{
          backgroundColor: safeTheme.primaryColor,
          animationDelay: '160ms',
          animationDuration: '1.4s'
        }}
      />
      <div
        className="w-2 h-2 rounded-full animate-bounce"
        style={{
          backgroundColor: safeTheme.primaryColor,
          animationDelay: '320ms',
          animationDuration: '1.4s'
        }}
      />
    </div>
  );
};

export default WidgetTypingIndicator;
