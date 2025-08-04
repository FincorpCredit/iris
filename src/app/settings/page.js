'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import AuthPreferencesSettings from '@/components/settings/auth-preferences'
import ChangePasswordForm from '@/components/auth/change-password-form'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/authContext'
import { 
  ArrowLeft, 
  User, 
  Shield, 
  Settings as SettingsIcon,
  Lock
} from 'lucide-react'

const SettingsPage = () => {
  const router = useRouter()
  const toast = useToast()
  const { user, isLoading, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    // Check authentication on mount
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  const handlePasswordChanged = () => {
    toast.success('Password Updated', 'Your password has been changed successfully.')
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

  if (!user) {
    return null // Will redirect to login
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'auth', label: 'Authentication', icon: Shield },
    { id: 'password', label: 'Change Password', icon: Lock }
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToDashboard}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              <SettingsIcon className="h-6 w-6 text-slate-500" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Settings
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                      Profile Information
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Full Name
                      </label>
                      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md">
                        {user.name}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Email Address
                      </label>
                      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md">
                        {user.email}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Role
                      </label>
                      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md capitalize">
                        {user.role}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Department
                      </label>
                      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md">
                        {user.department || 'Not specified'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      To update your profile information, please contact your administrator.
                    </p>
                  </div>
                </div>
              )}

              {/* Authentication Tab */}
              {activeTab === 'auth' && (
                <AuthPreferencesSettings userId={user.id} userEmail={user.email} />
              )}

              {/* Change Password Tab */}
              {activeTab === 'password' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                      Change Password
                    </h2>
                  </div>

                  <ChangePasswordForm
                    userId={user.id}
                    onPasswordChanged={handlePasswordChanged}
                    isRequired={false}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SettingsPage
