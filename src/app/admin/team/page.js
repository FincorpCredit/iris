'use client'

import React, { useState, useEffect } from 'react'
import AddTeamMemberDialog from '@/components/admin/add-team-member'
import AuthPreferencesSettings from '@/components/settings/auth-preferences'
import { useToast } from '@/hooks/use-toast'
import { 
  Users, 
  Shield, 
  Mail, 
  Calendar, 
  MoreVertical,
  Settings,
  UserCheck,
  UserX
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const TeamManagementPage = () => {
  const [teamMembers, setTeamMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState(null)
  const [showPreferencesDialog, setShowPreferencesDialog] = useState(false)
  const toast = useToast()

  // Load team members from database
  useEffect(() => {
    loadTeamMembers()
  }, [])

  const loadTeamMembers = async () => {
    try {
      const response = await fetch('/api/team/list')
      const result = await response.json()

      if (response.ok && result.success) {
        setTeamMembers(result.users)
      } else {
        throw new Error(result.error || 'Failed to load team members')
      }
    } catch (error) {
      console.error('Error loading team members:', error)
      toast.error('Error', 'Failed to load team members.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTeamMemberAdded = (newMember) => {
    // Refresh the team members list
    loadTeamMembers()
  }

  const handleShowPreferences = (member) => {
    setSelectedMember(member)
    setShowPreferencesDialog(true)
  }

  const getStatusBadge = (status) => {
    const variants = {
      ONLINE: 'default',
      OFFLINE: 'secondary',
      AWAY: 'outline',
      BREAK: 'destructive'
    }
    
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.toLowerCase()}
      </Badge>
    )
  }

  const getRoleBadge = (roleName) => {
    const isAdmin = roleName === 'admin'
    return (
      <Badge variant={isAdmin ? 'destructive' : 'outline'}>
        {isAdmin ? 'Admin' : 'Team Member'}
      </Badge>
    )
  }

  const getAuthBadge = (authPreference) => {
    return (
      <Badge variant="outline" className="gap-1">
        {authPreference === 'PASSWORD' ? (
          <>
            <Shield className="h-3 w-3" />
            Password
          </>
        ) : (
          <>
            <Mail className="h-3 w-3" />
            Email Code
          </>
        )}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading team members...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-3">
              <Users className="h-8 w-8" />
              Team Management
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Manage team members and their access to the Iris system
            </p>
          </div>
          <AddTeamMemberDialog onTeamMemberAdded={handleTeamMemberAdded} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Members</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{teamMembers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Online</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {teamMembers.filter(m => m.status === 'ONLINE').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Password Auth</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {teamMembers.filter(m => m.authPreference === 'PASSWORD').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Code Auth</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {teamMembers.filter(m => m.authPreference === 'CODE').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Members Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Team Members</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Auth Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-50">
                          {member.name}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {member.email}
                        </div>
                        {member.mustChangePassword && (
                          <Badge variant="destructive" className="mt-1">
                            Must change password
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(member.role.name)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(member.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getAuthBadge(member.authPreference)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(member.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleShowPreferences(member)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Auth Preferences
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Auth Preferences Dialog */}
        <Dialog open={showPreferencesDialog} onOpenChange={setShowPreferencesDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Authentication Preferences</DialogTitle>
              <DialogDescription>
                {selectedMember && `Manage authentication settings for ${selectedMember.name}`}
              </DialogDescription>
            </DialogHeader>
            {selectedMember && (
              <AuthPreferencesSettings userId={selectedMember.id} userEmail={selectedMember.email} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default TeamManagementPage
