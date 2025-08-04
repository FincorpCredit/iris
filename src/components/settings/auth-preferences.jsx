'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Shield, Key, Mail, Loader2, CheckCircle, Info } from 'lucide-react'

// Form validation schema
const authPreferencesSchema = z.object({
  authPreference: z.enum(['PASSWORD', 'CODE'], {
    required_error: 'Please select an authentication method',
  })
})

const AuthPreferencesSettings = ({ userId, userEmail }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true)
  const [currentPreference, setCurrentPreference] = useState(null)
  const toast = useToast()

  const form = useForm({
    resolver: zodResolver(authPreferencesSchema),
    defaultValues: {
      authPreference: 'PASSWORD'
    }
  })

  // Load current preferences
  useEffect(() => {
    if (userId) {
      loadCurrentPreferences()
    }
  }, [userId])

  const loadCurrentPreferences = async () => {
    try {
      const response = await fetch(`/api/auth/preferences?userId=${userId}`)
      const result = await response.json()

      if (response.ok && result.success) {
        setCurrentPreference(result.user.authPreference)
        form.setValue('authPreference', result.user.authPreference)
      } else {
        throw new Error(result.error || 'Failed to load preferences')
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
      toast.error('Error', 'Failed to load authentication preferences.')
    } finally {
      setIsLoadingPreferences(false)
    }
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          authPreference: data.authPreference
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update preferences')
      }

      // Update current preference
      setCurrentPreference(data.authPreference)

      // Show success toast
      const methodName = data.authPreference === 'PASSWORD' ? 'password' : '6-digit code'
      toast.success(
        'Preferences Updated!', 
        `Your authentication method has been changed to ${methodName}.`
      )

    } catch (error) {
      console.error('Error updating preferences:', error)
      toast.error(
        'Failed to Update Preferences',
        error.message || 'An unexpected error occurred. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestCode = async () => {
    if (currentPreference !== 'CODE') {
      toast.warning('Code Authentication Not Enabled', 'Please save your preferences first to enable code authentication.')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Test Code Sent!', 'A test login code has been sent to your email.')
      } else {
        throw new Error(result.error || 'Failed to send test code')
      }
    } catch (error) {
      console.error('Error sending test code:', error)
      toast.error('Failed to Send Test Code', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingPreferences) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Authentication Preferences</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Authentication Preferences</h3>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">Authentication Methods</h4>
            <div className="text-blue-800 dark:text-blue-200 text-sm mt-1 space-y-1">
              <p><strong>Password:</strong> Use your secure password to log in</p>
              <p><strong>6-Digit Code:</strong> Receive a temporary code via email for each login</p>
            </div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="authPreference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Authentication Method</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select authentication method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PASSWORD">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Password Authentication</div>
                          <div className="text-sm text-muted-foreground">Use your secure password</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="CODE">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Email Code Authentication</div>
                          <div className="text-sm text-muted-foreground">Receive 6-digit codes via email</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose how you want to authenticate when logging into Iris.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Save Preferences
                </>
              )}
            </Button>

            {currentPreference === 'CODE' && (
              <Button
                type="button"
                variant="outline"
                onClick={handleTestCode}
                disabled={isLoading}
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                Test Code
              </Button>
            )}
          </div>
        </form>
      </Form>

      {currentPreference && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            <strong>Current Method:</strong> {currentPreference === 'PASSWORD' ? 'Password Authentication' : 'Email Code Authentication'}
          </div>
        </div>
      )}
    </div>
  )
}

export default AuthPreferencesSettings
