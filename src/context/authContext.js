'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getAuthData,
  clearAuthData,
  storeAuthData,
  authenticatedFetch
} from '@/lib/auth-storage'
import { decodeToken, isTokenExpired } from '@/lib/jwt'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const authData = getAuthData()

      // If no tokens or user data, user is not authenticated
      if (!authData.accessToken || !authData.refreshToken || !authData.user) {
        setIsLoading(false)
        return
      }

      // Check if access token is expired
      if (isTokenExpired(authData.accessToken)) {
        // Token is expired, try to refresh
        const refreshSuccess = await refreshToken()
        if (!refreshSuccess) {
          // Refresh failed, user needs to login again
          setIsLoading(false)
          return
        }
      } else {
        // Token is still valid, restore user session
        setUser(authData.user)
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      // Clear invalid auth data and logout
      clearAuthData()
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshToken = async () => {
    try {
      const authData = getAuthData()
      
      if (!authData.refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: authData.refreshToken })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Store new tokens
        storeAuthData({
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          user: result.user
        })

        setUser(result.user)
        setIsAuthenticated(true)
        return true
      } else {
        throw new Error('Token refresh failed')
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      // Clear invalid auth data but don't redirect (let checkAuthStatus handle it)
      clearAuthData()
      setUser(null)
      setIsAuthenticated(false)
      return false
    }
  }

  const login = async (email, password, code) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          code
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Login failed')
      }

      // Store authentication data
      storeAuthData({
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        user: result.user
      })

      setUser(result.user)
      setIsAuthenticated(true)

      return {
        success: true,
        user: result.user,
        mustChangePassword: result.mustChangePassword
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      // Call logout API if authenticated
      if (isAuthenticated) {
        await authenticatedFetch('/api/auth/logout', {
          method: 'POST'
        })
      }
    } catch (error) {
      console.error('Logout API error:', error)
      // Continue with logout even if API call fails
    } finally {
      // Clear local storage and state
      clearAuthData()
      setUser(null)
      setIsAuthenticated(false)
      router.push('/login')
    }
  }

  const updateUser = (userData) => {
    setUser(userData)
    storeAuthData({
      accessToken: getAuthData().accessToken,
      refreshToken: getAuthData().refreshToken,
      user: userData
    })
  }

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshToken,
    updateUser,
    checkAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
