'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/authContext'
import { 
  LogOut, 
  User, 
  Shield, 
  Settings,
  Users,
  MessageSquare,
  BarChart3
} from 'lucide-react'

const DashboardPage = () => {
  const router = useRouter()
  const toast = useToast()
  const { user, isLoading, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    // Check authentication on mount
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged Out', 'You have been successfully logged out.')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Logout Error', 'There was an issue logging out.')
    }
  }

  const navigateToTeamManagement = () => {
    router.push('/admin/team')
  }

  const navigateToSettings = () => {
    router.push('/settings')
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

  const isAdmin = user.role === 'admin'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Iris Dashboard
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {user.name}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  isAdmin 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {isAdmin ? 'Admin' : 'Team Member'}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Welcome back, {user.name}!
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Here's what's happening with your team today.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Team Management - Admin Only */}
          {isAdmin && (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow cursor-pointer"
                 onClick={navigateToTeamManagement}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Team Management
                </h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                Add team members, manage permissions, and view team activity.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Manage Team
              </Button>
            </div>
          )}

          {/* Chat Management */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Chat Management
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
              View and manage customer conversations and support tickets.
            </p>
            <Button variant="outline" size="sm" className="w-full">
              View Chats
            </Button>
          </div>

          {/* Reports - Admin Only */}
          {isAdmin && (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Reports & Analytics
                </h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                View performance metrics and generate reports.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                View Reports
              </Button>
            </div>
          )}

          {/* Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow cursor-pointer"
               onClick={navigateToSettings}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <Settings className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Settings
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
              Manage your profile, preferences, and authentication settings.
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Open Settings
            </Button>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
            Account Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Name</label>
              <p className="text-slate-900 dark:text-slate-50">{user.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Email</label>
              <p className="text-slate-900 dark:text-slate-50">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Role</label>
              <p className="text-slate-900 dark:text-slate-50 capitalize">{user.role}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Authentication</label>
              <p className="text-slate-900 dark:text-slate-50">
                {user.authPreference === 'PASSWORD' ? 'Password' : 'Email Code'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
