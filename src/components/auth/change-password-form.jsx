'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription 
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'

// Password validation schema
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const ChangePasswordForm = ({ userId, onPasswordChanged, isRequired = false }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const toast = useToast()

  const form = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        })
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.details && Array.isArray(result.details)) {
          // Show password validation errors
          result.details.forEach(error => {
            toast.error('Password Requirements', error)
          })
        } else {
          throw new Error(result.error || 'Failed to change password')
        }
        return
      }

      // Show success toast
      toast.success(
        'Password Changed Successfully!', 
        'Your password has been updated. You can now use your new password to log in.'
      )

      // Reset form
      form.reset()
      
      // Notify parent component
      onPasswordChanged?.()

    } catch (error) {
      console.error('Error changing password:', error)
      toast.error(
        'Failed to Change Password',
        error.message || 'An unexpected error occurred. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const PasswordInput = ({ field, show, onToggle, placeholder }) => (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        disabled={isLoading}
        {...field}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={onToggle}
        disabled={isLoading}
      >
        {show ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      {isRequired && (
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
            <Lock className="h-5 w-5" />
            <h3 className="font-semibold">Password Change Required</h3>
          </div>
          <p className="text-amber-800 dark:text-amber-200 text-sm mt-2">
            For security reasons, you must change your temporary password before accessing the system.
          </p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    field={field}
                    show={showCurrentPassword}
                    onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
                    placeholder="Enter your current password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    field={field}
                    show={showNewPassword}
                    onToggle={() => setShowNewPassword(!showNewPassword)}
                    placeholder="Enter your new password"
                  />
                </FormControl>
                <FormDescription>
                  Password must be at least 8 characters with uppercase, lowercase, number, and special character.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    field={field}
                    show={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                    placeholder="Confirm your new password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Changing Password...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Change Password
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}

export default ChangePasswordForm
