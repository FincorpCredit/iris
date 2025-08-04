// src/app/api/auth/change-password/route.js

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  hashPassword, 
  verifyPassword, 
  validatePasswordStrength 
} from '@/lib/auth-utils';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { userId, currentPassword, newPassword } = await request.json();

    // Validate input
    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'User ID, current password, and new password are required' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.passwordHash);
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Password does not meet requirements',
          details: passwordValidation.errors
        },
        { status: 400 }
      );
    }

    // Check if new password is different from current
    const isSamePassword = await verifyPassword(newPassword, user.passwordHash);
    
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update user password and clear mustChangePassword flag
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedNewPassword,
        mustChangePassword: false,
        passwordChangedAt: new Date()
      }
    });

    // Log the action for audit
    await prisma.auditlog.create({
      data: {
        userId: user.id,
        action: 'CHANGE_PASSWORD',
        resource: 'AUTH',
        resourceId: user.id,
        metadata: JSON.stringify({
          passwordChangedAt: new Date(),
          wasForced: user.mustChangePassword
        })
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully.'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
