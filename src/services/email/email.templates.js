/**
 * @file email.templates.js
 * @description HTML builder functions for all email types.
 */

// Returns HTML for welcome email.
export const welcomeEmailHtml = (name) => `
  <p>Hi ${name},</p>
  <p>Welcome to mn bety Platform! We're glad to have you.</p>
`;

// Returns HTML for email verification — link expires in 24 hours.
export const verificationEmailHtml = (url) => `
  <p>Click the link below to verify your email address:</p>
  <a href="${url}">Verify Email</a>
  <p>This link expires in 24 hours. If you didn't register, ignore this email.</p>
`;

// Returns HTML for password reset — link expires in 15 minutes.
export const passwordResetEmailHtml = (url) => `
  <p>You requested a password reset:</p>
  <a href="${url}">Reset Password</a>
  <p>This link expires in 15 minutes. If you didn't request this, ignore this email.</p>
`;
