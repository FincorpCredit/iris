'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { SunIcon, MoonIcon, DesktopIcon } from '@radix-ui/react-icons'
import { useTheme, THEMES } from '@/context/themeContext'

const ThemeToggle = ({ variant = 'button', showLabels = false, className = '' }) => {
  const { theme, actualTheme, setTheme } = useTheme()

  if (variant === 'dropdown') {
    return (
      <div className={`relative inline-block ${className}`}>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 pr-8 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600"
        >
          <option value={THEMES.LIGHT}>Light</option>
          <option value={THEMES.DARK}>Dark</option>
          <option value={THEMES.SYSTEM}>System</option>
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    )
  }

  if (variant === 'tabs') {
    const tabs = [
      { value: THEMES.LIGHT, icon: SunIcon, label: 'Light' },
      { value: THEMES.DARK, icon: MoonIcon, label: 'Dark' },
      { value: THEMES.SYSTEM, icon: DesktopIcon, label: 'System' }
    ]

    return (
      <div className={`relative inline-flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 ${className}`}>
        {tabs.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 z-10 ${
              theme === value
                ? 'text-slate-900 dark:text-slate-50'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {showLabels && <span>{label}</span>}
            
            {/* Animated background */}
            {theme === value && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white dark:bg-slate-700 rounded-md shadow-sm"
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
    )
  }

  // Default button variant - simple toggle
  return (
    <button
      onClick={() => setTheme(actualTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT)}
      className={`relative inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 ${className}`}
      title={`Switch to ${actualTheme === THEMES.LIGHT ? 'dark' : 'light'} mode`}
    >
      <div className="relative w-5 h-5">
        <motion.div
          animate={{ 
            opacity: actualTheme === THEMES.LIGHT ? 1 : 0,
            rotate: actualTheme === THEMES.LIGHT ? 0 : 90,
            scale: actualTheme === THEMES.LIGHT ? 1 : 0.75
          }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
        >
          <SunIcon className="w-5 h-5" />
        </motion.div>
        <motion.div
          animate={{ 
            opacity: actualTheme === THEMES.DARK ? 1 : 0,
            rotate: actualTheme === THEMES.DARK ? 0 : -90,
            scale: actualTheme === THEMES.DARK ? 1 : 0.75
          }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
        >
          <MoonIcon className="w-5 h-5" />
        </motion.div>
      </div>
    </button>
  )
}

export default ThemeToggle
