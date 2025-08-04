// src/app/api/team/add/route.js

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendTemporaryPasswordEmail } from '@/lib/email';
import { 
  generateTemporaryPassword, 
  hashPassword, 
  sanitizeEmail, 
  isValidEmail 
} from '@/lib/auth-utils';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { name, email } = await request.json();

    // Validate input
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A team member with this email already exists' },
        { status: 409 }
      );
    }

    // Get the agent role (team member role)
    const agentRole = await prisma.role.findUnique({
      where: { name: 'agent' }
    });

    if (!agentRole) {
      return NextResponse.json(
        { error: 'Agent role not found. Please run database seed.' },
        { status: 500 }
      );
    }

    // Generate temporary password
    const tempPassword = generateTemporaryPassword();
    const hashedPassword = await hashPassword(tempPassword);

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: sanitizedEmail,
        passwordHash: hashedPassword,
        roleId: agentRole.id,
        mustChangePassword: true,
        authPreference: 'PASSWORD', // Default to password auth
        status: 'OFFLINE'
      },
      include: {
        role: true
      }
    });

    // Send email with temporary password
    const loginUrl = `${process.env.NEXT_PUBLIC_API_URL}/login`;
    const emailResult = await sendTemporaryPasswordEmail(
      sanitizedEmail,
      name.trim(),
      tempPassword,
      loginUrl
    );

    if (!emailResult.success) {
      // If email fails, we should still return success but log the error
      console.error('Failed to send email:', emailResult.error);
      
      return NextResponse.json({
        success: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role.name
        },
        emailSent: false,
        message: 'Team member created successfully, but email could not be sent. Please provide login credentials manually.'
      });
    }

    // Log the action for audit
    await prisma.auditlog.create({
      data: {
        userId: newUser.id, // In a real app, this would be the admin user ID
        action: 'CREATE_USER',
        resource: 'USER',
        resourceId: newUser.id,
        metadata: JSON.stringify({
          createdUser: {
            name: newUser.name,
            email: newUser.email,
            role: newUser.role.name
          }
        })
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role.name
      },
      emailSent: true,
      message: 'Team member added successfully and invitation email sent.'
    });

  } catch (error) {
    console.error('Error adding team member:', error);
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
