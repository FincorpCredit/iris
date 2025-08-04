'use client'

import React from 'react'
import { useNotifications } from '@/context/notificationsContext'
import { 
  CheckIcon, 
  TrashIcon, 
  CheckCircledIcon,
  ExclamationTriangleIcon,
  CrossCircledIcon,
  InfoCircledIcon,
  BellIcon
} from '@radix-ui/react-icons'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

const NotificationsPanel = ({ isOpen, onClose, className = '' }) => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    removeNotification, 
    markAllAsRead, 
    clearAll 
  } = useNotifications()

  const formatTime = (timestamp) => {
    const now = new Date()
    const notificationTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircledIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
      case 'error':
        return <CrossCircledIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
      case 'info':
      default:
        return <InfoCircledIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-96 max-w-[calc(100vw-2rem)] p-0">
        <SheetHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-lg font-semibold">
                Notifications
              </SheetTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="flex items-center gap-2 p-4 border-b bg-muted/30">
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                variant="outline"
                size="sm"
                className="text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950"
              >
                <CheckIcon className="w-4 h-4" />
                Mark all read
              </Button>
            )}
            <Button
              onClick={clearAll}
              variant="outline"
              size="sm"
              className="text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <TrashIcon className="w-4 h-4" />
              Clear all
            </Button>
          </div>
        )}

        {/* Notifications List */}
        <ScrollArea className="flex-1 h-[calc(100vh-200px)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full">
              <BellIcon className="w-12 h-12 text-muted-foreground mb-3" />
              <h4 className="text-lg font-medium mb-1">
                No notifications
              </h4>
              <p className="text-muted-foreground text-sm">
                You're all caught up! New notifications will appear here.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id}
                  className={`transition-all hover:shadow-md ${
                    notification.isRead 
                      ? 'bg-muted/30 border-muted' 
                      : 'bg-background border-border shadow-sm'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getNotificationIcon(notification.type)}
                          <h4 className={`font-medium text-sm truncate ${
                            notification.isRead 
                              ? 'text-muted-foreground' 
                              : 'text-foreground'
                          }`}>
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className={`text-xs mb-3 leading-relaxed ${
                          notification.isRead 
                            ? 'text-muted-foreground/80' 
                            : 'text-muted-foreground'
                        }`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(notification.timestamp)}
                          </span>
                          <div className="flex items-center gap-1">
                            {!notification.isRead && (
                              <Button
                                onClick={() => markAsRead(notification.id)}
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-950"
                                title="Mark as read"
                              >
                                <CheckIcon className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              onClick={() => removeNotification(notification.id)}
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                              title="Remove notification"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

export default NotificationsPanel
