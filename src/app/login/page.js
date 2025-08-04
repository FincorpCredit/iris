'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  LogIn, 
  Mail, 
  Lock,
  Shield
} from 'lucide-react'
import { clearAuthData, getAuthData } from '@/lib/auth-storage'
import { useAuth } from '@/context/authContext'

// Form validation schemas
const passwordLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
})

const codeLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must contain only numbers')
})

const LoginPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()
  const { login } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [authMode, setAuthMode] = useState('password') // 'password' or 'code'
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [tempPassword, setTempPassword] = useState('')

  const passwordForm = useForm({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const codeForm = useForm({
    resolver: zodResolver(codeLoginSchema),
    defaultValues: {
      email: '',
      code: ''
    }
  })

  // Check for temp password parameter
  useEffect(() => {
    const temp = searchParams.get('temp')
    if (temp) {
      setTempPassword(temp)
      passwordForm.setValue('password', temp)
      toast.info('Temporary Password', 'Your temporary password has been filled in. Please log in and change your password.')
    }

    // Only clear auth data if user is not authenticated (to avoid clearing tokens after successful login)
    // This prevents the issue where tokens are cleared after login but before redirect
    const authData = getAuthData()
    if (!authData.isAuthenticated) {
      clearAuthData()
    }
  }, [searchParams, passwordForm, toast])

  const handlePasswordLogin = async (data) => {
    setIsLoading(true)

    try {
      const result = await login(data.email, data.password)

      toast.success('Login Successful!', `Welcome back, ${result.user.name}!`)

      // Let the RouteGuard handle the redirect based on authentication state
      // The RouteGuard will automatically redirect to /change-password if mustChangePassword is true
      // or to the appropriate dashboard/chat page if not

    } catch (error) {
      console.error('Login error:', error)
      toast.error('Login Failed', error.message || 'Please check your credentials and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeLogin = async (data) => {
    setIsLoading(true)

    try {
      const result = await login(data.email, null, data.code)

      toast.success('Login Successful!', `Welcome back, ${result.user.name}!`)

      // Redirect based on user role
      const redirectPath = result.user.role === 'admin' ? '/dashboard' : '/chat'
      router.push(redirectPath)

    } catch (error) {
      console.error('Code login error:', error)
      toast.error('Login Failed', error.message || 'Please check your code and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendCode = async () => {
    const email = codeForm.getValues('email')
    
    if (!email) {
      toast.error('Email Required', 'Please enter your email address first.')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send code')
      }

      setIsCodeSent(true)
      toast.success('Code Sent!', 'A 6-digit code has been sent to your email.')

    } catch (error) {
      console.error('Send code error:', error)
      toast.error('Failed to Send Code', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              Welcome to Iris
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Sign in to your account
            </p>
          </div>

          {/* Auth Mode Toggle */}
          <div className="flex mb-6 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setAuthMode('password')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                authMode === 'password'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50'
              }`}
            >
              <Lock className="h-4 w-4 inline mr-2" />
              Password
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('code')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                authMode === 'code'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50'
              }`}
            >
              <Mail className="h-4 w-4 inline mr-2" />
              Email Code
            </button>
          </div>

          {/* Password Login Form */}
          {authMode === 'password' && (
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordLogin)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            disabled={isLoading}
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
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
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}

          {/* Code Login Form */}
          {authMode === 'code' && (
            <Form {...codeForm}>
              <form onSubmit={codeForm.handleSubmit(handleCodeLogin)} className="space-y-4">
                <FormField
                  control={codeForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isCodeSent ? (
                  <Button
                    type="button"
                    onClick={handleSendCode}
                    disabled={isLoading}
                    className="w-full gap-2"
                    variant="outline"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Send Login Code
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <FormField
                      control={codeForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>6-Digit Code</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter the code from your email"
                              disabled={isLoading}
                              maxLength={6}
                              {...field}
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
                          Verifying...
                        </>
                      ) : (
                        <>
                          <LogIn className="h-4 w-4" />
                          Verify & Sign In
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      onClick={() => setIsCodeSent(false)}
                      disabled={isLoading}
                      variant="ghost"
                      className="w-full"
                    >
                      Send New Code
                    </Button>
                  </>
                )}
              </form>
            </Form>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Need help? Contact your administrator for assistance.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
