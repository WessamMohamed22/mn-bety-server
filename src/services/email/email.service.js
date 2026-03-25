/**
 * @file email.service.js
 * @description handles all email sending operations — transporter setup, and email templates.
 */

import nodemailer from "nodemailer";
import { createInternalError } from "../../errors/error.factory.js";
import { MESSAGES } from "../../constants/messages.js";
import { env } from "../../config/env.js";

// --- Transporter -----------------------------------------------------

export let transporter = null;

// Creates and stores the nodemailer transporter using env config.
export const initializeEmailTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST || "smtp.gmail.com",
      port: env.EMAIL_PORT,
      secure: env.EMAIL_SECURE === "true",
      auth: {
        user: env.EMAIL.USER,
        pass: env.EMAIL.PASSWORD,
      },
    });
  }
  return transporter;
};

// Verifies the transporter connection - exits process if mail server is unreachable.
export const verifyEmailTransporter = async () => {
  if (!transporter) initializeEmailTransporter();

  try {
    await transporter.verify();
  } catch (err) {
    console.error("Mail server connection failed — check EMAIL config");
    if (env.isProduction) {
      process.exit(1);
    }
  }
};

// --- Base Sender -----------------------------------------------------
/**
 * Sends an email using the configured transporter.
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.html
 */
export const sendEmail = async ({ to, subject, html }) => {
  if (!transporter) initializeEmailTransporter();

  try {
    // 1. Send email via transporter
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    });
  } catch (error) {
    // 2. Throw internal error if sending fails
    throw createInternalError(MESSAGES.ERROR.FAILED_TO_SEND_EMAIL);
  }
};
