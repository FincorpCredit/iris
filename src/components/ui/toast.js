'use client'

import { Toaster as Sonner } from 'sonner'
import { useTheme } from '@/context/themeContext'

const Toaster = ({ ...props }) => {
  const { actualTheme } = useTheme()

  return (
    <Sonner
      theme={actualTheme}
      className="toaster group"
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-slate-50 group-[.toaster]:text-slate-900 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-slate-900 dark:group-[.toaster]:text-slate-50 dark:group-[.toaster]:border-slate-800',
          description: 'group-[.toast]:text-slate-600 dark:group-[.toast]:text-slate-400',
          actionButton:
            'group-[.toast]:bg-slate-900 group-[.toast]:text-slate-50 dark:group-[.toast]:bg-slate-50 dark:group-[.toast]:text-slate-900',
          cancelButton:
            'group-[.toast]:bg-slate-100 group-[.toast]:text-slate-600 dark:group-[.toast]:bg-slate-800 dark:group-[.toast]:text-slate-400',
          success:
            'group-[.toaster]:bg-emerald-50 group-[.toaster]:text-emerald-900 group-[.toaster]:border-emerald-200 dark:group-[.toaster]:bg-emerald-950 dark:group-[.toaster]:text-emerald-50 dark:group-[.toaster]:border-emerald-800',
          error:
            'group-[.toaster]:bg-red-50 group-[.toaster]:text-red-900 group-[.toaster]:border-red-200 dark:group-[.toaster]:bg-red-950 dark:group-[.toaster]:text-red-50 dark:group-[.toaster]:border-red-800',
          warning:
            'group-[.toaster]:bg-amber-50 group-[.toaster]:text-amber-900 group-[.toaster]:border-amber-200 dark:group-[.toaster]:bg-amber-950 dark:group-[.toaster]:text-amber-50 dark:group-[.toaster]:border-amber-800',
          info:
            'group-[.toaster]:bg-blue-50 group-[.toaster]:text-blue-900 group-[.toaster]:border-blue-200 dark:group-[.toaster]:bg-blue-950 dark:group-[.toaster]:text-blue-50 dark:group-[.toaster]:border-blue-800',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
