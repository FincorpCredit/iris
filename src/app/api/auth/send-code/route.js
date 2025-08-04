// src/app/api/auth/send-code/route.js

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendLoginCodeEmail } from '@/lib/email';
import { 
  generateSecureCode, 
  generateCodeExpiry, 
  sanitizeEmail, 
  isValidEmail 
} from '@/lib/auth-utils';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { email } = await request.json();

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const sanitizedEmail = sanitizeEmail(email);
    
    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email address' },
        { status: 404 }
      );
    }

    // Check if user prefers code authentication
    if (user.authPreference !== 'CODE') {
      return NextResponse.json(
        { error: 'Code authentication is not enabled for this account' },
        { status: 400 }
      );
    }

    // Generate 6-digit code and expiry
    const code = generateSecureCode(6);
    const expiry = generateCodeExpiry(10); // 10 minutes

    // Update user with temporary code
    await prisma.user.update({
      where: { id: user.id },
      data: {
        tempCode: code,
        tempCodeExpiry: expiry
      }
    });

    // Send email with code
    const emailResult = await sendLoginCodeEmail(
      sanitizedEmail,
      user.name,
      code
    );

    if (!emailResult.success) {
      console.error('Failed to send login code email:', emailResult.error);
      
      return NextResponse.json(
        { error: 'Failed to send login code. Please try again.' },
        { status: 500 }
      );
    }

    // Log the action for audit
    await prisma.auditlog.create({
      data: {
        userId: user.id,
        action: 'SEND_LOGIN_CODE',
        resource: 'AUTH',
        resourceId: user.id,
        metadata: JSON.stringify({
          email: sanitizedEmail,
          codeExpiry: expiry
        })
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Login code sent to your email address.',
      expiresIn: 10 // minutes
    });

  } catch (error) {
    console.error('Error sending login code:', error);
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
