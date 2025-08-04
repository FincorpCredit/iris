'use client'

import React, { useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

const ResizableSidebar = ({ 
  children, 
  defaultWidth = 320, 
  minWidth = 280, 
  maxWidth = 500,
  className 
}) => {
  const [width, setWidth] = useState(defaultWidth)
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef(null)

  const startResizing = useCallback((mouseDownEvent) => {
    setIsResizing(true)
    
    const startX = mouseDownEvent.clientX
    const startWidth = width

    const doDrag = (mouseMoveEvent) => {
      const newWidth = startWidth + mouseMoveEvent.clientX - startX
      const clampedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth)
      setWidth(clampedWidth)
    }

    const stopDrag = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', doDrag)
      document.removeEventListener('mouseup', stopDrag)
    }

    document.addEventListener('mousemove', doDrag)
    document.addEventListener('mouseup', stopDrag)
  }, [width, minWidth, maxWidth])

  return (
    <div 
      ref={sidebarRef}
      className={cn("relative flex-shrink-0 hidden lg:flex", className)}
      style={{ width: `${width}px` }}
    >
      {/* Sidebar content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
      
      {/* Resize handle */}
      <div
        className={cn(
          "absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-border transition-colors",
          "after:absolute after:top-0 after:right-[-2px] after:w-1 after:h-full after:bg-transparent",
          isResizing && "bg-primary"
        )}
        onMouseDown={startResizing}
      >
        {/* Visual indicator on hover */}
        <div className="absolute top-1/2 right-[-1px] transform -translate-y-1/2 w-0.5 h-8 bg-muted-foreground/30 rounded-full opacity-0 hover:opacity-100 transition-opacity" />
      </div>
      
      {/* Overlay during resize to prevent text selection */}
      {isResizing && (
        <div className="fixed inset-0 z-50 cursor-col-resize" />
      )}
    </div>
  )
}

export default ResizableSidebar
