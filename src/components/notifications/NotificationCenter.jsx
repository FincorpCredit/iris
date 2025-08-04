'use client'

import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, MessageCircle, UserPlus, ArrowRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useRealtime } from '@/context/realtimeContext';
import { useAgentChat } from '@/hooks/useAgentChat';

/**
 * Notification Center Component
 * Real-time notification system with badge counts and interactive notifications
 */
export const NotificationCenter = ({ className, ...props }) => {
  const { notifications, unreadCount, isConnected } = useRealtime();
  const { markNotificationsAsRead } = useAgentChat();
  const [isOpen, setIsOpen] = useState(false);
  const [displayNotifications, setDisplayNotifications] = useState([]);

  // Update display notifications when real-time notifications change
  useEffect(() => {
    setDisplayNotifications(notifications.slice(0, 20)); // Show last 20 notifications
  }, [notifications]);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d ago`;
    }
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'NEW_MESSAGE':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'CHAT_ASSIGNED':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'CHAT_TRANSFERRED':
        return <ArrowRight className="h-4 w-4 text-orange-500" />;
      case 'CUSTOMER_WAITING':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'CHAT_RESOLVED':
        return <CheckCheck className="h-4 w-4 text-green-600" />;
      case 'MENTION':
        return <MessageCircle className="h-4 w-4 text-purple-500" />;
      case 'SYSTEM_ALERT':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markNotificationsAsRead([notification.id]);
    }

    // Navigate to action URL if provided
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }

    setIsOpen(false);
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    await markNotificationsAsRead(null, true);
  };

  // Clear all notifications
  const handleClearAll = () => {
    setDisplayNotifications([]);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
          {...props}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          {/* Connection status indicator */}
          <div
            className={cn(
              'absolute -bottom-1 -right-1 h-2 w-2 rounded-full',
              isConnected ? 'bg-green-500' : 'bg-gray-400'
            )}
            title={isConnected ? 'Real-time connected' : 'Real-time disconnected'}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
        </div>

        <ScrollArea className="h-96">
          {displayNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">No notifications</p>
              <p className="text-xs text-gray-400 mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {displayNotifications.map((notification, index) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  formatTimestamp={formatTimestamp}
                  getIcon={getNotificationIcon}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {isConnected ? 'Real-time updates active' : 'Real-time disconnected'}
            </span>
            <div className="flex items-center gap-1">
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  isConnected ? 'bg-green-500' : 'bg-gray-400'
                )}
              />
              <span>{isConnected ? 'Connected' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

/**
 * Individual Notification Item Component
 */
const NotificationItem = ({ notification, onClick, formatTimestamp, getIcon }) => {
  return (
    <div
      className={cn(
        'p-4 hover:bg-gray-50 cursor-pointer transition-colors',
        !notification.isRead && 'bg-blue-50 border-l-4 border-l-blue-500'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 line-clamp-1">
                {notification.title}
              </p>
              <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                {notification.message}
              </p>
            </div>
            
            {/* Unread indicator */}
            {!notification.isRead && (
              <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {formatTimestamp(notification.createdAt)}
            </span>
            
            {/* Chat info if available */}
            {notification.chat && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={notification.chat.customer?.avatar} />
                  <AvatarFallback className="text-xs">
                    {notification.chat.customer?.name?.charAt(0) || 'C'}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate max-w-20">
                  {notification.chat.customer?.name || notification.chat.customer?.email}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
