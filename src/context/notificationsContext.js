"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'

// Create notifications context
const NotificationsContext = createContext({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  removeNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearAll: () => {}
})

// Custom hook to use notifications context
export const useNotifications = () => {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
}

// Sample notifications for testing
const sampleNotifications = [
  {
    id: 1,
    type: 'info',
    title: 'New message from Sarah Johnson',
    message: 'Can you help me with the billing issue? I\'ve been trying to resolve this for the past hour.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    isRead: false
  },
  {
    id: 2,
    type: 'warning',
    title: 'New case assigned',
    message: 'Case #12345 has been assigned to you. Priority: High',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    isRead: false
  },
  {
    id: 3,
    type: 'success',
    title: 'Case resolved',
    message: 'Case #12340 has been successfully resolved by the customer.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isRead: true
  },
  {
    id: 4,
    type: 'info',
    title: 'System maintenance',
    message: 'Scheduled maintenance will begin at 2:00 AM EST tonight.',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    isRead: true
  }
]

// Notifications provider component
export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(sampleNotifications)

  // Calculate unread count
  const unreadCount = notifications.filter(notification => !notification.isRead).length

  // Add a new notification
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now() + Math.random(), // Simple ID generation
      timestamp: new Date(),
      isRead: false,
      type: 'info', // info, success, warning, error
      ...notification
    }
    
    setNotifications(prev => [newNotification, ...prev])
    return newNotification.id
  }

  // Remove a notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    )
  }

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    )
  }

  // Clear all notifications
  const clearAll = () => {
    setNotifications([])
  }

  // Auto-remove notifications after a certain time (optional)
  useEffect(() => {
    const autoRemoveInterval = setInterval(() => {
      const now = new Date()
      setNotifications(prev => 
        prev.filter(notification => {
          // Remove notifications older than 24 hours if they're read
          const hoursDiff = (now - notification.timestamp) / (1000 * 60 * 60)
          return !(notification.isRead && hoursDiff > 24)
        })
      )
    }, 60000) // Check every minute

    return () => clearInterval(autoRemoveInterval)
  }, [])

  const value = {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll
  }

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export default NotificationsProvider
