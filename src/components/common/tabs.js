'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'

const Tabs = ({ 
  tabs = [], 
  defaultValue, 
  onValueChange,
  className = '',
  tabsClassName = '',
  contentClassName = '',
  size = 'default' // 'sm', 'default', 'lg'
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue || tabs[0]?.value)

  const handleTabChange = (value) => {
    setActiveTab(value)
    onValueChange?.(value)
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    default: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Navigation */}
      <div className={`relative inline-flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 ${tabsClassName}`}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`relative flex items-center gap-2 ${sizeClasses[size]} rounded-md font-medium transition-colors duration-200 z-10 ${
              activeTab === tab.value
                ? 'text-slate-900 dark:text-slate-50'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            disabled={tab.disabled}
          >
            {tab.icon && <tab.icon className="w-4 h-4" />}
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
                {tab.badge}
              </span>
            )}
            
            {/* Animated background - flat design, no shadow */}
            {activeTab === tab.value && (
              <motion.div
                layoutId="activeTabBackground"
                className="absolute inset-0 bg-white dark:bg-slate-700 rounded-md"
                style={{ zIndex: -1 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={`mt-4 ${contentClassName}`}>
        {tabs.map((tab) => (
          <div
            key={tab.value}
            className={activeTab === tab.value ? 'block' : 'hidden'}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  )
}

// Compound component pattern for more flexible usage
const TabsList = ({ children, className = '', size = 'default' }) => {
  return (
    <div className={`relative inline-flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 ${className}`}>
      {children}
    </div>
  )
}

const TabsTrigger = ({ 
  value, 
  children, 
  isActive, 
  onClick, 
  disabled = false,
  size = 'default',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    default: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  return (
    <button
      onClick={() => onClick(value)}
      disabled={disabled}
      className={`relative flex items-center gap-2 ${sizeClasses[size]} rounded-md font-medium transition-colors duration-200 z-10 ${
        isActive
          ? 'text-slate-900 dark:text-slate-50'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
      
      {/* Animated background - flat design, no shadow */}
      {isActive && (
        <motion.div
          layoutId="activeTabBackground"
          className="absolute inset-0 bg-white dark:bg-slate-700 rounded-md"
          style={{ zIndex: -1 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
        />
      )}
    </button>
  )
}

const TabsContent = ({ value, activeValue, children, className = '' }) => {
  return (
    <div className={`${activeValue === value ? 'block' : 'hidden'} ${className}`}>
      {children}
    </div>
  )
}

// Export both patterns
export { Tabs as default, TabsList, TabsTrigger, TabsContent }
