'use client'

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/authContext'
import { Shield, Loader2 } from 'lucide-react'

const RouteGuard = ({ children }) => {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isLoading) return // Wait for auth check to complete

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/']
    const isPublicRoute = publicRoutes.includes(pathname)

    // If not authenticated and trying to access protected route
    if (!isAuthenticated && !isPublicRoute) {
      router.push('/login')
      return
    }

    // If authenticated, handle routing logic
    if (isAuthenticated && user) {
      // If user must change password, only allow change-password page
      if (user.mustChangePassword && pathname !== '/change-password') {
        router.push('/change-password')
        return
      }

      // If password is changed and user is on change-password page, redirect appropriately
      if (!user.mustChangePassword && pathname === '/change-password') {
        const redirectPath = user.role === 'admin' ? '/dashboard' : '/chat'
        router.push(redirectPath)
        return
      }

      // If user is on login page but already authenticated, redirect to appropriate page
      if (pathname === '/login') {
        if (user.mustChangePassword) {
          router.push('/change-password')
        } else {
          const redirectPath = user.role === 'admin' ? '/dashboard' : '/chat'
          router.push(redirectPath)
        }
        return
      }

      // If user is on root page, redirect to appropriate page
      if (pathname === '/') {
        if (user.mustChangePassword) {
          router.push('/change-password')
        } else {
          const redirectPath = user.role === 'admin' ? '/dashboard' : '/chat'
          router.push(redirectPath)
        }
        return
      }

      // Role-based access control
      if (user.role !== 'admin') {
        // Non-admin users can't access admin routes
        const adminRoutes = ['/admin', '/dashboard']
        const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
        
        if (isAdminRoute) {
          router.push('/chat')
          return
        }
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, router])

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Render children if all checks pass
  return children
}

export default RouteGuard
