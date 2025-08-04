'use client'

import React from 'react'
import { BellIcon } from '@radix-ui/react-icons'
import NotificationBadge from './notification-badge'

const BellIconWithNotifications = ({ 
  size = 'default', 
  className = '',
  onClick,
  badgeSize = 'default',
  badgePosition = 'top-right'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <NotificationBadge 
      size={badgeSize} 
      position={badgePosition}
      className={className}
    >
      <button
        onClick={onClick}
        className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600"
        title="Notifications"
      >
        <BellIcon className={sizeClasses[size]} />
      </button>
    </NotificationBadge>
  )
}

export default BellIconWithNotifications
