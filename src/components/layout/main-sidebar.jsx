'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronDown, ChevronRight, MessageSquare, AtSign, AlertCircle, PanelLeftClose, PanelLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const MainSidebar = () => {
  const [expandedSections, setExpandedSections] = useState(['conversations'])
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  const toggleSection = (section) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const navigationItems = [
    {
      id: 'conversations',
      label: 'Conversations',
      icon: MessageSquare,
      children: [
        {
          label: 'All conversations',
          href: '/chat',
          count: 12,
          icon: MessageSquare
        },
        {
          label: 'Mentions',
          href: '/chat/mentions',
          count: 3,
          icon: AtSign
        },
        {
          label: 'Unattended',
          href: '/chat/unattended',
          count: 5,
          icon: AlertCircle
        }
      ]
    }
  ]

  return (
    <div className={cn(
      "hidden md:flex h-full bg-background border-r border-border flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Collapse Toggle */}
      <div className="p-2 border-b border-border flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-8 h-8"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </Button>
      </div>

      {!isCollapsed && (
        <>
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
          </div>
          <ScrollArea className="flex-1 p-2">
            <nav className="space-y-1">
              {navigationItems.map((item) => (
                <div key={item.id}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start px-3 py-2 h-auto",
                      "hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => toggleSection(item.id)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <item.icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      {expandedSections.includes(item.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </Button>

                  {expandedSections.includes(item.id) && item.children && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.children.map((child) => {
                        const isActive = pathname === child.href
                        return (
                          <Link key={child.href} href={child.href}>
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-full justify-start px-3 py-1.5 h-auto text-sm",
                                "hover:bg-accent hover:text-accent-foreground",
                                isActive && "bg-accent text-accent-foreground font-medium"
                              )}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <child.icon className={cn(
                                    "w-3 h-3",
                                    isActive && "text-primary"
                                  )} />
                                  <span>{child.label}</span>
                                </div>
                                {child.count > 0 && (
                                  <span className={cn(
                                    "text-xs px-1.5 py-0.5 rounded-full",
                                    isActive
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted text-muted-foreground"
                                  )}>
                                    {child.count}
                                  </span>
                                )}
                              </div>
                            </Button>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </ScrollArea>
        </>
      )}

      {isCollapsed && (
        <div className="flex-1 p-2">
          <nav className="space-y-2">
            <Link href="/chat" title="All conversations">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "w-full h-10",
                  pathname === "/chat" && "bg-accent text-accent-foreground"
                )}
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/chat/mentions" title="Mentions">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "w-full h-10",
                  pathname === "/chat/mentions" && "bg-accent text-accent-foreground"
                )}
              >
                <AtSign className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/chat/unattended" title="Unattended">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "w-full h-10",
                  pathname === "/chat/unattended" && "bg-accent text-accent-foreground"
                )}
              >
                <AlertCircle className="w-4 h-4" />
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </div>
  )
}

export default MainSidebar
