'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ChangePasswordForm from '@/components/auth/change-password-form'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/authContext'
import { Shield, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ChangePasswordPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()
  const { user, updateUser } = useAuth()
  const [userId, setUserId] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Priority order: authenticated user context, URL params, then session storage
    let currentUserId = null
    let currentUserInfo = null

    // First check if user is authenticated and has mustChangePassword
    if (user && user.id) {
      currentUserId = user.id
      currentUserInfo = user
    } else {
      // Fallback to URL params for non-authenticated flow (e.g., password reset)
      const userIdFromParams = searchParams.get('userId')
      currentUserId = userIdFromParams
    }

    if (!currentUserId) {
      toast.error('Access Denied', 'Please log in to change your password.')
      router.push('/login')
      return
    }

    setUserId(currentUserId)

    // If we have user info from context, use it directly
    if (currentUserInfo) {
      setUserInfo(currentUserInfo)
      setIsLoading(false)
    } else {
      // Otherwise fetch user info from API
      fetchUserInfo(currentUserId)
    }
  }, [searchParams, router, toast, user])

  const fetchUserInfo = async (userId) => {
    try {
      const response = await fetch(`/api/auth/preferences?userId=${userId}`)
      const result = await response.json()

      if (response.ok && result.success) {
        setUserInfo(result.user)
      } else {
        throw new Error(result.error || 'Failed to fetch user information')
      }
    } catch (error) {
      console.error('Error fetching user info:', error)
      toast.error('Error', 'Failed to load user information.')
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChanged = () => {
    toast.success(
      'Password Updated!',
      'Your password has been changed successfully. Redirecting...'
    )

    // Update user state to reflect password change
    if (user) {
      updateUser({
        ...user,
        mustChangePassword: false
      })
    } else if (userInfo) {
      // If no user context but we have userInfo, update it locally
      setUserInfo({
        ...userInfo,
        mustChangePassword: false
      })
    }

    // Clear temporary user ID from storage
    sessionStorage.removeItem('tempUserId')

    // Redirect based on user role - use userInfo as fallback
    setTimeout(() => {
      const userRole = user?.role || userInfo?.role
      const redirectPath = userRole === 'admin' ? '/dashboard' : '/chat'
      router.push(redirectPath)
    }, 2000)
  }

  const handleBackToLogin = () => {
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!userId || !userInfo) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
            Access Denied
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            You don't have permission to access this page.
          </p>
          <Button onClick={handleBackToLogin} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              Change Password
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Welcome to Iris, {userInfo.name}!
            </p>
          </div>

          {/* Password Change Form */}
          <ChangePasswordForm
            userId={userId}
            onPasswordChanged={handlePasswordChanged}
            isRequired={true}
          />

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="ghost"
              onClick={handleBackToLogin}
              className="w-full gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Need help? Contact your administrator for assistance.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ChangePasswordPage
