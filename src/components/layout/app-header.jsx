'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  UserCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import NotificationsPanel from '@/components/ui/notifications-panel'
import { useAuth } from '@/context/authContext'
import { useNotifications } from '@/context/notificationsContext'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'



const AppHeader = ({
  title = "Iris Chat",
  className,
  showUserMenu = true,
  showNotifications = true
}) => {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const toast = useToast()
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged Out', 'You have been successfully logged out.')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Logout Error', 'There was an issue logging out. Please try again.')
    }
  }

  const navigateToSettings = () => {
    router.push('/settings')
  }

  const navigateToProfile = () => {
    router.push('/profile')
  }



  if (!user) {
    return null
  }

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700",
      className
    )}>
      <div className="flex justify-between items-center h-14 px-4">
        {/* Left side - Title */}
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {title}
          </h1>
        </div>

        {/* Right side - Notifications, User info and actions */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          {showNotifications && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="relative p-2"
                onClick={() => setIsNotificationOpen(true)}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>

              <NotificationsPanel
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
              />
            </>
          )}

          {showUserMenu && (
            <>
              {/* User info display - Desktop */}
              <div className="hidden sm:flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profileImage} alt={user.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-50">
                    {user.name}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {user.role === 'admin' ? 'Admin' : 'Agent'}
                  </Badge>
                </div>
              </div>

              {/* Desktop buttons */}
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={navigateToSettings}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>

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

              {/* Mobile dropdown menu */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.profileImage} alt={user.name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                          {user.name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{user.name}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                        <Badge 
                          variant="secondary" 
                          className="text-xs w-fit mt-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {user.role === 'admin' ? 'Admin' : 'Agent'}
                        </Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={navigateToProfile}>
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={navigateToSettings}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AppHeader
