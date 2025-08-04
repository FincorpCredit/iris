'use client'

import React from 'react'
import MainSidebar from './main-sidebar'
import AppHeader from './app-header'

const ChatLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Top Header Bar */}
      <AppHeader />

      {/* Main content with top padding */}
      <div className="flex w-full pt-14">
        {/* Main Navigation Sidebar */}
        <MainSidebar />

        {/* Chat Content Area */}
        <div className="flex-1 flex">
          {children}
        </div>
      </div>
    </div>
  )
}

export default ChatLayout
