import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/widget/settings
 * Get widget configuration settings
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const widgetName = searchParams.get('name') || 'default';

    // Get widget settings
    let settings = await prisma.widget_settings.findUnique({
      where: { name: widgetName }
    });

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.widget_settings.create({
        data: {
          name: widgetName,
          isEnabled: true,
          welcomeMessage: "Hi! How can I help you today?",
          offlineMessage: "We're currently offline. Leave us a message and we'll get back to you!",
          theme: {
            primaryColor: "#3b82f6",
            textColor: "#1f2937",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            fontFamily: "Inter, sans-serif"
          },
          position: "bottom-right",
          showAgentPhotos: true,
          showTypingIndicator: true,
          enableFileUpload: true,
          enableEmojis: true,
          maxFileSize: 10485760, // 10MB
          allowedFileTypes: ["image/*", "application/pdf", ".doc", ".docx"],
          businessHours: {
            enabled: false,
            timezone: "UTC",
            schedule: {
              monday: { enabled: true, start: "09:00", end: "17:00" },
              tuesday: { enabled: true, start: "09:00", end: "17:00" },
              wednesday: { enabled: true, start: "09:00", end: "17:00" },
              thursday: { enabled: true, start: "09:00", end: "17:00" },
              friday: { enabled: true, start: "09:00", end: "17:00" },
              saturday: { enabled: false, start: "09:00", end: "13:00" },
              sunday: { enabled: false, start: "09:00", end: "17:00" }
            }
          },
          autoAssignment: true,
          requireEmail: true,
          requireName: true,
          collectPhone: false,
          customFields: []
        }
      });
    }

    // Check if widget is currently within business hours (if enabled)
    let isWithinBusinessHours = true;
    if (settings.businessHours?.enabled) {
      isWithinBusinessHours = checkBusinessHours(settings.businessHours);
    }

    return NextResponse.json({
      success: true,
      settings: {
        id: settings.id,
        name: settings.name,
        isEnabled: settings.isEnabled,
        welcomeMessage: settings.welcomeMessage,
        offlineMessage: settings.offlineMessage,
        theme: settings.theme,
        position: settings.position,
        showAgentPhotos: settings.showAgentPhotos,
        showTypingIndicator: settings.showTypingIndicator,
        enableFileUpload: settings.enableFileUpload,
        enableEmojis: settings.enableEmojis,
        maxFileSize: settings.maxFileSize,
        allowedFileTypes: settings.allowedFileTypes,
        businessHours: settings.businessHours,
        autoAssignment: settings.autoAssignment,
        requireEmail: settings.requireEmail,
        requireName: settings.requireName,
        collectPhone: settings.collectPhone,
        customFields: settings.customFields,
        isWithinBusinessHours,
        currentMessage: isWithinBusinessHours ? settings.welcomeMessage : settings.offlineMessage
      }
    });

  } catch (error) {
    console.error('Widget settings retrieval error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve widget settings',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * PUT /api/widget/settings
 * Update widget configuration settings (admin only)
 */
export async function PUT(request) {
  try {
    // Note: In a production app, you'd want to add authentication here
    // to ensure only admins can update widget settings
    
    const body = await request.json();
    const { name = 'default', ...updateData } = body;

    // Validate theme if provided
    if (updateData.theme) {
      const validThemeKeys = ['primaryColor', 'textColor', 'backgroundColor', 'borderRadius', 'fontFamily'];
      const themeKeys = Object.keys(updateData.theme);
      const invalidKeys = themeKeys.filter(key => !validThemeKeys.includes(key));
      
      if (invalidKeys.length > 0) {
        return NextResponse.json(
          { error: `Invalid theme keys: ${invalidKeys.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Update settings
    const settings = await prisma.widget_settings.upsert({
      where: { name },
      update: updateData,
      create: {
        name,
        ...updateData
      }
    });

    return NextResponse.json({
      success: true,
      settings: {
        id: settings.id,
        name: settings.name,
        isEnabled: settings.isEnabled,
        welcomeMessage: settings.welcomeMessage,
        offlineMessage: settings.offlineMessage,
        theme: settings.theme,
        position: settings.position,
        showAgentPhotos: settings.showAgentPhotos,
        showTypingIndicator: settings.showTypingIndicator,
        enableFileUpload: settings.enableFileUpload,
        enableEmojis: settings.enableEmojis,
        maxFileSize: settings.maxFileSize,
        allowedFileTypes: settings.allowedFileTypes,
        businessHours: settings.businessHours,
        autoAssignment: settings.autoAssignment,
        requireEmail: settings.requireEmail,
        requireName: settings.requireName,
        collectPhone: settings.collectPhone,
        customFields: settings.customFields
      },
      message: 'Widget settings updated successfully'
    });

  } catch (error) {
    console.error('Widget settings update error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update widget settings',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Check if current time is within business hours
 */
function checkBusinessHours(businessHours) {
  if (!businessHours?.enabled) {
    return true;
  }

  const now = new Date();
  const timezone = businessHours.timezone || 'UTC';
  
  // Convert current time to business timezone
  const currentTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  const dayOfWeek = currentTime.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  const daySchedule = businessHours.schedule?.[dayOfWeek];
  
  if (!daySchedule?.enabled) {
    return false;
  }

  // Parse start and end times
  const [startHour, startMinute] = daySchedule.start.split(':').map(Number);
  const [endHour, endMinute] = daySchedule.end.split(':').map(Number);
  
  const startTimeMinutes = startHour * 60 + startMinute;
  const endTimeMinutes = endHour * 60 + endMinute;

  return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
}
