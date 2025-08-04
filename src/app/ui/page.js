'use client'

import React, { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useTheme } from '@/context/themeContext'
import { useNotifications } from '@/context/notificationsContext'
import ThemeToggle from '@/components/ui/theme-toggle'
import Tabs, { TabsList, TabsTrigger, TabsContent } from '@/components/common/tabs'
import BellIconWithNotifications from '@/components/ui/bell-icon'
import NotificationBadge, { NotificationCount } from '@/components/ui/notification-badge'
import NotificationsPanel from '@/components/ui/notifications-panel'
import { HomeIcon, GearIcon, PersonIcon, ChatBubbleIcon } from '@radix-ui/react-icons'

const Home = () => {
  const toast = useToast()
  const { theme, actualTheme } = useTheme()
  const { addNotification, markAllAsRead, clearAll, notifications } = useNotifications()
  
  // Demo state for undo operations
  const [items, setItems] = useState([
    { id: 1, name: 'Document 1', status: 'active' },
    { id: 2, name: 'Document 2', status: 'active' },
    { id: 3, name: 'Document 3', status: 'active' },
  ])

  // Tabs demo state
  const [compoundActiveTab, setCompoundActiveTab] = useState('overview')
  
  // Notifications panel state
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false)

  const handleSuccessToast = () => {
    toast.success('Success!', 'Your action was completed successfully.')
  }

  const handleWarningToast = () => {
    toast.warning('Warning!', 'Please check your input before proceeding.')
  }

  const handleErrorToast = () => {
    toast.error('Error!', 'Something went wrong. Please try again.')
  }

  const handleInfoToast = () => {
    toast.info('Information', 'Here is some useful information for you.')
  }

  const handlePromiseToast = () => {
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() > 0.5 ? resolve() : reject()
      }, 2000)
    })

    toast.promise(promise, {
      loading: 'Processing your request...',
      success: 'Request completed successfully!',
      error: 'Request failed. Please try again.'
    })
  }

  const handleActionToast = () => {
    toast.action(
      'Action Required',
      'Click the button to perform an action.',
      'Do Action',
      () => {
        toast.success('Action completed!', 'The action was performed successfully.')
      }
    )
  }

  // Notification demo functions
  const addSampleNotification = () => {
    const notifications = [
      { title: 'New Message', message: 'You have a new message from John', type: 'info' },
      { title: 'Task Completed', message: 'Your export has finished successfully', type: 'success' },
      { title: 'Warning', message: 'Your storage is almost full', type: 'warning' },
      { title: 'Error', message: 'Failed to sync data', type: 'error' }
    ]
    
    const randomNotification = notifications[Math.floor(Math.random() * notifications.length)]
    addNotification(randomNotification)
  }

  // Undo demo functions
  const handleDeleteItem = (item) => {
    // Simulate delete
    setItems(prev => prev.filter(i => i.id !== item.id))
    
    // Show undo toast
    toast.delete(item.name, () => {
      // Undo function - restore the item
      setItems(prev => [...prev, item])
    })
  }

  const handleArchiveItem = (item) => {
    // Simulate archive
    setItems(prev => prev.map(i => 
      i.id === item.id ? { ...i, status: 'archived' } : i
    ))
    
    // Show undo toast
    toast.archive(item.name, () => {
      // Undo function - unarchive the item
      setItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, status: 'active' } : i
      ))
    })
  }

  const handleMoveItem = (item) => {
    // Simulate move
    setItems(prev => prev.map(i => 
      i.id === item.id ? { ...i, status: 'moved' } : i
    ))
    
    // Show undo toast
    toast.move(item.name, 'Trash', () => {
      // Undo function - move back
      setItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, status: 'active' } : i
      ))
    })
  }

  const handleCustomUndo = () => {
    let undoData = { value: 'original' }
    undoData.value = 'modified'
    
    toast.undo(
      'Data Modified',
      'The data has been changed.',
      () => {
        undoData.value = 'original'
        console.log('Data restored to:', undoData.value)
      },
      { variant: 'warning' }
    )
  }

  // Sample tabs data
  const simpleTabs = [
    {
      value: 'dashboard',
      label: 'Dashboard',
      icon: HomeIcon,
      content: (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">Dashboard</h3>
          <p className="text-slate-600 dark:text-slate-400">Welcome to your dashboard! Here you can see an overview of your activity.</p>
        </div>
      )
    },
    {
      value: 'messages',
      label: 'Messages',
      icon: ChatBubbleIcon,
      badge: <NotificationCount size="sm" />,
      content: (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">Messages</h3>
          <p className="text-slate-600 dark:text-slate-400">Your notifications and messages appear here.</p>
        </div>
      )
    },
    {
      value: 'profile',
      label: 'Profile',
      icon: PersonIcon,
      content: (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">Profile</h3>
          <p className="text-slate-600 dark:text-slate-400">Manage your profile settings and preferences.</p>
        </div>
      )
    },
    {
      value: 'settings',
      label: 'Settings',
      icon: GearIcon,
      disabled: true,
      content: (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">Settings</h3>
          <p className="text-slate-600 dark:text-slate-400">Configure your application settings.</p>
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Theme Toggle and Bell Icon */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50">
            Iris Demo
          </h1>
          <div className="flex items-center gap-4">
            <BellIconWithNotifications 
              onClick={() => setIsNotificationsPanelOpen(true)}
            />
            <ThemeToggle />
          </div>
        </div>
        
        {/* Notifications Panel */}
        <NotificationsPanel 
          isOpen={isNotificationsPanelOpen}
          onClose={() => setIsNotificationsPanelOpen(false)}
        />
        
        {/* Notifications Demo */}
        <div className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">
            Notifications System
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={addSampleNotification}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add Notification
              </button>
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Mark All Read
              </button>
              <button
                onClick={clearAll}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Clear All
              </button>
            </div>

            {/* Example usage in different contexts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-2">Sidebar Item</h4>
                <NotificationBadge>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                    <ChatBubbleIcon className="w-4 h-4" />
                    <span className="text-sm">Messages</span>
                  </div>
                </NotificationBadge>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-2">Standalone Count</h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Notifications:</span>
                  <NotificationCount />
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-2">Different Positions</h4>
                <div className="flex gap-4">
                  <NotificationBadge position="top-left" badgeSize="sm">
                    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded"></div>
                  </NotificationBadge>
                  <NotificationBadge position="bottom-right" badgeSize="lg">
                    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded"></div>
                  </NotificationBadge>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Theme Controls Showcase */}
        <div className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">
            Theme Controls
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-slate-600 dark:text-slate-400 min-w-[120px]">
                Current: {actualTheme} ({theme})
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600 dark:text-slate-400 min-w-[100px]">Button:</span>
                <ThemeToggle variant="button" />
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600 dark:text-slate-400 min-w-[100px]">Tabs:</span>
                <ThemeToggle variant="tabs" />
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600 dark:text-slate-400 min-w-[100px]">Tabs + Labels:</span>
                <ThemeToggle variant="tabs" showLabels />
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600 dark:text-slate-400 min-w-[100px]">Dropdown:</span>
                <ThemeToggle variant="dropdown" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Component Demo */}
        <div className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">
            Tabs Component Demo
          </h2>
          
          <div className="space-y-6">
            {/* Simple Tabs Usage */}
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-3">Simple Usage (with Notification Badge)</h3>
              <Tabs 
                tabs={simpleTabs}
                defaultValue="dashboard"
                onValueChange={(value) => console.log('Tab changed to:', value)}
              />
            </div>

            {/* Compound Component Usage */}
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-3">Compound Component Usage</h3>
              <div>
                <TabsList>
                  <TabsTrigger
                    value="overview"
                    isActive={compoundActiveTab === 'overview'}
                    onClick={() => setCompoundActiveTab('overview')}
                  >
                    <HomeIcon className="w-4 h-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="analytics"
                    isActive={compoundActiveTab === 'analytics'}
                    onClick={() => setCompoundActiveTab('analytics')}
                  >
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger
                    value="reports"
                    isActive={compoundActiveTab === 'reports'}
                    onClick={() => setCompoundActiveTab('reports')}
                  >
                    Reports
                  </TabsTrigger>
                </TabsList>

                <div className="mt-4">
                  <TabsContent value="overview" activeValue={compoundActiveTab}>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">Overview</h4>
                      <p className="text-slate-600 dark:text-slate-400">This is the overview content with compound components.</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="analytics" activeValue={compoundActiveTab}>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">Analytics</h4>
                      <p className="text-slate-600 dark:text-slate-400">Analytics data and charts would go here.</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="reports" activeValue={compoundActiveTab}>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">Reports</h4>
                      <p className="text-slate-600 dark:text-slate-400">Generate and view reports from this section.</p>
                    </div>
                  </TabsContent>
                </div>
              </div>
            </div>

            {/* Different Sizes */}
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-3">Different Sizes</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">Small:</span>
                  <Tabs 
                    tabs={simpleTabs.slice(0, 3)}
                    defaultValue="dashboard"
                    size="sm"
                  />
                </div>
                <div>
                  <span className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">Large:</span>
                  <Tabs 
                    tabs={simpleTabs.slice(0, 3)}
                    defaultValue="dashboard"
                    size="lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Toast Demo */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              Basic Toasts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleSuccessToast}
                className="p-4 bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-50 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
              >
                Success Toast
              </button>

              <button
                onClick={handleWarningToast}
                className="p-4 bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-50 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors"
              >
                Warning Toast
              </button>

              <button
                onClick={handleErrorToast}
                className="p-4 bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-50 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
              >
                Error Toast
              </button>

              <button
                onClick={handleInfoToast}
                className="p-4 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-50 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
              >
                Info Toast
              </button>

              <button
                onClick={handlePromiseToast}
                className="p-4 bg-purple-50 dark:bg-purple-950 text-purple-900 dark:text-purple-50 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors"
              >
                Promise Toast
              </button>

              <button
                onClick={handleActionToast}
                className="p-4 bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-50 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
              >
                Action Toast
              </button>
            </div>
          </div>

          {/* Undo Toast Demo */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              Undo Operations
            </h2>
            
            {/* Demo Items */}
            <div className="space-y-2">
              {items.map(item => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    item.status === 'active' 
                      ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      : item.status === 'archived'
                      ? 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800'
                      : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                  }`}
                >
                  <span className="text-slate-900 dark:text-slate-50">
                    {item.name} ({item.status})
                  </span>
                  {item.status === 'active' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => handleArchiveItem(item)}
                        className="px-3 py-1 text-sm bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 rounded hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
                      >
                        Archive
                      </button>
                      <button
                        onClick={() => handleMoveItem(item)}
                        className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                      >
                        Move
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleCustomUndo}
              className="w-full p-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Custom Undo Toast
            </button>
          </div>
        </div>

        <div className="mt-8 p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
            Component Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-2">Theme Toggle</h4>
              <ul className="text-slate-600 dark:text-slate-400 space-y-1 text-sm">
                <li>• Radix UI React icons</li>
                <li>• Smooth Framer Motion animations</li>
                <li>• Multiple variants</li>
                <li>• Accessible with focus states</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-2">Tabs Component</h4>
              <ul className="text-slate-600 dark:text-slate-400 space-y-1 text-sm">
                <li>• Framer Motion sliding animation</li>
                <li>• Flat design (no shadows)</li>
                <li>• Icons, badges, disabled states</li>
                <li>• Multiple sizes and patterns</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-2">Toast System</h4>
              <ul className="text-slate-600 dark:text-slate-400 space-y-1 text-sm">
                <li>• Configurable positioning</li>
                <li>• Undo operations</li>
                <li>• Extended duration for actions</li>
                <li>• Theme-aware styling</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-2">Notifications</h4>
              <ul className="text-slate-600 dark:text-slate-400 space-y-1 text-sm">
                <li>• Global context management</li>
                <li>• Red notification badges</li>
                <li>• Multiple sizes and positions</li>
                <li>• Auto-cleanup and read states</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home