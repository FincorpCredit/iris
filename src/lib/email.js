// src/lib/email.js

import nodemailer from 'nodemailer';

// Create transporter using environment variables
const createTransporter = () => {
  const port = parseInt(process.env.MAIL_PORT);
  const isSecure = port === 465; // Use secure for port 465, otherwise use STARTTLS

  return nodemailer.createTransport({
    host: process.env.MAIL_SERVER,
    port: port,
    secure: isSecure, // true for 465, false for other ports like 587
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates
    }
  });
};

// Send temporary password email
export const sendTemporaryPasswordEmail = async (email, name, tempPassword, loginUrl) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.MAIL_DEFAULT_SENDER,
      to: email,
      subject: 'Welcome to Iris - Your Account Access',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Iris</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Iris</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>You have been added as a team member to the Iris system. Your account has been created and you can now access the platform.</p>
              
              <div class="credentials">
                <h3>Your Login Credentials:</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Temporary Password:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${tempPassword}</code></p>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> You must change your password on first login for security purposes.
              </div>
              
              <a href="${loginUrl}?temp=${encodeURIComponent(tempPassword)}" class="button">Login to Iris</a>
              
              <p>If you have any questions or need assistance, please contact your administrator.</p>
              
              <div class="footer">
                <p>This is an automated message from Iris Team Management System.</p>
                <p>Please do not reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Temporary password email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending temporary password email:', error);
    return { success: false, error: error.message };
  }
};

// Send 6-digit code email
export const sendLoginCodeEmail = async (email, name, code) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.MAIL_DEFAULT_SENDER,
      to: email,
      subject: 'Iris - Your Login Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Login Code</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .code { background: white; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #2563eb; }
            .code-number { font-size: 36px; font-weight: bold; color: #2563eb; letter-spacing: 8px; font-family: monospace; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Login Code</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Here is your 6-digit login code for Iris:</p>
              
              <div class="code">
                <div class="code-number">${code}</div>
                <p style="margin-top: 15px; color: #6b7280;">Enter this code to access your account</p>
              </div>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> This code will expire in 10 minutes. Do not share this code with anyone.
              </div>
              
              <p>If you didn't request this code, please contact your administrator immediately.</p>
              
              <div class="footer">
                <p>This is an automated message from Iris Team Management System.</p>
                <p>Please do not reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Login code email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending login code email:', error);
    return { success: false, error: error.message };
  }
};

// Test email configuration
export const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return { success: true };
  } catch (error) {
    console.error('Email configuration error:', error);
    return { success: false, error: error.message };
  }
};
