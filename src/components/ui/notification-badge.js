'use client'

import React from 'react'
import { useNotifications } from '@/context/notificationsContext'

const NotificationBadge = ({ 
  children, 
  showZero = false, 
  maxCount = 99,
  size = 'default', // 'sm', 'default', 'lg'
  position = 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
  className = '',
  badgeClassName = '',
  animate = true
}) => {
  const { unreadCount } = useNotifications()

  // Don't show badge if count is 0 and showZero is false
  if (unreadCount === 0 && !showZero) {
    return <div className={className}>{children}</div>
  }

  // Size configurations
  const sizeClasses = {
    sm: 'min-w-[16px] h-4 text-xs px-1',
    default: 'min-w-[20px] h-5 text-xs px-1.5',
    lg: 'min-w-[24px] h-6 text-sm px-2'
  }

  // Position configurations
  const positionClasses = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
    'bottom-left': '-bottom-1 -left-1'
  }

  // Display count (cap at maxCount)
  const displayCount = unreadCount > maxCount ? `${maxCount}+` : unreadCount.toString()

  return (
    <div className={`relative inline-block ${className}`}>
      {children}
      
      {/* Notification Badge */}
      <div
        className={`absolute ${positionClasses[position]} ${sizeClasses[size]} bg-red-500 text-white rounded-full flex items-center justify-center font-medium leading-none ${
          animate ? 'transition-all duration-200 ease-in-out' : ''
        } ${badgeClassName}`}
        style={{
          transform: animate && unreadCount > 0 ? 'scale(1)' : 'scale(0.8)',
          opacity: unreadCount > 0 ? 1 : 0.8
        }}
      >
        {displayCount}
      </div>
    </div>
  )
}

// Standalone badge without wrapper (for use in tabs, etc.)
export const NotificationCount = ({ 
  showZero = false,
  maxCount = 99,
  size = 'default',
  className = '',
  animate = true
}) => {
  const { unreadCount } = useNotifications()

  // Don't render if count is 0 and showZero is false
  if (unreadCount === 0 && !showZero) {
    return null
  }

  const sizeClasses = {
    sm: 'min-w-[16px] h-4 text-xs px-1',
    default: 'min-w-[20px] h-5 text-xs px-1.5',
    lg: 'min-w-[24px] h-6 text-sm px-2'
  }

  const displayCount = unreadCount > maxCount ? `${maxCount}+` : unreadCount.toString()

  return (
    <div
      className={`${sizeClasses[size]} bg-red-500 text-white rounded-full flex items-center justify-center font-medium leading-none ${
        animate ? 'transition-all duration-200 ease-in-out' : ''
      } ${className}`}
      style={{
        transform: animate && unreadCount > 0 ? 'scale(1)' : 'scale(0.8)',
        opacity: unreadCount > 0 ? 1 : 0.8
      }}
    >
      {displayCount}
    </div>
  )
}

export default NotificationBadge
