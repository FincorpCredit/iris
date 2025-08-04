'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Mail, User, Phone, Building } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Customer Form Component
 * Collects customer information before starting chat
 */
export const CustomerForm = ({
  onSubmit,
  settings,
  theme,
  isLoading = false,
  className,
  ...props
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });
  const [errors, setErrors] = useState({});

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Required fields based on settings
    if (settings?.requireName && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (settings?.requireEmail && !formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (settings?.collectPhone && settings?.requirePhone && !formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    // At minimum, we need an email to identify the customer
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required to start the conversation';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Prepare customer data
    const customerData = {
      email: formData.email.trim(),
      name: formData.name.trim() || null,
      phone: formData.phone.trim() || null,
      metadata: {
        company: formData.company.trim() || null,
        initialMessage: formData.message.trim() || null,
        source: 'widget',
        userAgent: navigator.userAgent,
        referrer: document.referrer || 'direct',
        timestamp: new Date().toISOString()
      }
    };

    onSubmit(customerData);
  };

  // Email validation
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <div className={cn('p-4 flex-1 flex flex-col', className)} {...props}>
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="font-semibold text-lg mb-2" style={{ color: theme.textColor }}>
          Start a Conversation
        </h3>
        <p className="text-sm text-gray-600">
          Please provide your details to get started
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
        {/* Name Field */}
        {(settings?.requireName || settings?.collectName !== false) && (
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Name {settings?.requireName && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Your full name"
              className={cn(errors.name && 'border-red-500')}
              style={{
                borderColor: errors.name ? '#ef4444' : theme.primaryColor + '40',
                focusBorderColor: theme.primaryColor
              }}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="your.email@example.com"
            className={cn(errors.email && 'border-red-500')}
            style={{
              borderColor: errors.email ? '#ef4444' : theme.primaryColor + '40',
              focusBorderColor: theme.primaryColor
            }}
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        {/* Phone Field */}
        {settings?.collectPhone && (
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone {settings?.requirePhone && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              className={cn(errors.phone && 'border-red-500')}
              style={{
                borderColor: errors.phone ? '#ef4444' : theme.primaryColor + '40',
                focusBorderColor: theme.primaryColor
              }}
            />
            {errors.phone && (
              <p className="text-xs text-red-500">{errors.phone}</p>
            )}
          </div>
        )}

        {/* Company Field */}
        {settings?.customFields?.some(field => field.name === 'company') && (
          <div className="space-y-2">
            <Label htmlFor="company" className="text-sm font-medium flex items-center gap-2">
              <Building className="h-4 w-4" />
              Company
            </Label>
            <Input
              id="company"
              type="text"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              placeholder="Your company name"
              style={{
                borderColor: theme.primaryColor + '40',
                focusBorderColor: theme.primaryColor
              }}
            />
          </div>
        )}

        {/* Initial Message */}
        <div className="space-y-2">
          <Label htmlFor="message" className="text-sm font-medium">
            How can we help you? (Optional)
          </Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            placeholder="Briefly describe what you need help with..."
            className="min-h-[80px] resize-none"
            style={{
              borderColor: theme.primaryColor + '40',
              focusBorderColor: theme.primaryColor
            }}
          />
        </div>

        {/* Submit Button */}
        <div className="mt-auto pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
            style={{
              backgroundColor: theme.primaryColor,
              color: theme.backgroundColor
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Starting conversation...
              </>
            ) : (
              'Start Conversation'
            )}
          </Button>
        </div>

        {/* Privacy Notice */}
        <div className="text-xs text-gray-500 text-center mt-2">
          By starting a conversation, you agree to our privacy policy.
          Your information will be used to provide customer support.
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;
