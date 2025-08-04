"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'

// Theme options
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
}

// Create theme context
const ThemeContext = createContext({
  theme: THEMES.SYSTEM,
  actualTheme: THEMES.LIGHT,
  setTheme: () => {},
  toggleTheme: () => {}
})

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check if we're in the browser before accessing localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedTheme = localStorage.getItem('theme')
      return savedTheme && Object.values(THEMES).includes(savedTheme) 
        ? savedTheme 
        : THEMES.SYSTEM
    }
    return THEMES.SYSTEM
  })

  const [actualTheme, setActualTheme] = useState(THEMES.LIGHT)

  // Function to get system theme preference
  const getSystemTheme = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? THEMES.DARK 
        : THEMES.LIGHT
    }
    return THEMES.LIGHT
  }

  // Update actual theme based on current theme setting
  useEffect(() => {
    let newActualTheme
    
    if (theme === THEMES.SYSTEM) {
      newActualTheme = getSystemTheme()
    } else {
      newActualTheme = theme
    }
    
    setActualTheme(newActualTheme)
    
    // Apply theme to document (only in browser)
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newActualTheme)
      document.documentElement.className = newActualTheme
    }
  }, [theme])

  // Listen for system theme changes when using system theme
  useEffect(() => {
    if (theme !== THEMES.SYSTEM || typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e) => {
      const newSystemTheme = e.matches ? THEMES.DARK : THEMES.LIGHT
      setActualTheme(newSystemTheme)
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', newSystemTheme)
        document.documentElement.className = newSystemTheme
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  // Save theme to localStorage when it changes (only in browser)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('theme', theme)
    }
  }, [theme])

  // Function to change theme
  const changeTheme = (newTheme) => {
    if (Object.values(THEMES).includes(newTheme)) {
      setTheme(newTheme)
    }
  }

  // Function to toggle between light and dark (skips system)
  const toggleTheme = () => {
    if (actualTheme === THEMES.LIGHT) {
      setTheme(THEMES.DARK)
    } else {
      setTheme(THEMES.LIGHT)
    }
  }

  const value = {
    theme,
    actualTheme,
    setTheme: changeTheme,
    toggleTheme,
    isLight: actualTheme === THEMES.LIGHT,
    isDark: actualTheme === THEMES.DARK,
    isSystem: theme === THEMES.SYSTEM
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeProvider