'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { MoreHorizontal, MessageSquare, AtSign, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const MobileNavButton = () => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navigationItems = [
    {
      label: 'All conversations',
      href: '/chat',
      icon: MessageSquare,
      count: 12
    },
    {
      label: 'Mentions',
      href: '/chat/mentions',
      icon: AtSign,
      count: 3
    },
    {
      label: 'Unattended',
      href: '/chat/unattended',
      icon: AlertCircle,
      count: 5
    }
  ]

  const handleLinkClick = () => {
    setIsOpen(false)
  }

  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="m-2">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="h-full bg-background border-r border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
            </div>
            
            <div className="flex-1 p-2">
              <nav className="space-y-1">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link key={item.href} href={item.href} onClick={handleLinkClick}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start px-3 py-2 h-auto text-sm",
                          "hover:bg-accent hover:text-accent-foreground",
                          isActive && "bg-accent text-accent-foreground font-medium"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <item.icon className={cn(
                              "w-4 h-4",
                              isActive && "text-primary"
                            )} />
                            <span>{item.label}</span>
                          </div>
                          {item.count > 0 && (
                            <span className={cn(
                              "text-xs px-1.5 py-0.5 rounded-full",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}>
                              {item.count}
                            </span>
                          )}
                        </div>
                      </Button>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default MobileNavButton
