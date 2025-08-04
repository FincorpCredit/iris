'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
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
import { UserPlus, Loader2, Mail, User } from 'lucide-react'

// Form validation schema
const addTeamMemberSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z.string()
    .email('Please enter a valid email address')
    .toLowerCase()
})

const AddTeamMemberDialog = ({ onTeamMemberAdded }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()

  const form = useForm({
    resolver: zodResolver(addTeamMemberSchema),
    defaultValues: {
      name: '',
      email: ''
    }
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/team/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add team member')
      }

      // Show success toast
      if (result.emailSent) {
        toast.success(
          'Team Member Added!', 
          `${data.name} has been added and an invitation email has been sent to ${data.email}.`
        )
      } else {
        toast.warning(
          'Team Member Added', 
          `${data.name} has been added, but the invitation email could not be sent. Please provide login credentials manually.`
        )
      }

      // Reset form and close dialog
      form.reset()
      setIsOpen(false)
      
      // Notify parent component
      onTeamMemberAdded?.(result.user)

    } catch (error) {
      console.error('Error adding team member:', error)
      toast.error(
        'Failed to Add Team Member',
        error.message || 'An unexpected error occurred. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open) => {
    if (!isLoading) {
      setIsOpen(open)
      if (!open) {
        form.reset()
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Team Member
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Team Member
          </DialogTitle>
          <DialogDescription>
            Add a new team member to the Iris system. They will receive an email with login instructions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter full name"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Add Team Member
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default AddTeamMemberDialog
