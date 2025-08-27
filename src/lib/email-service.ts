import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import type { Event } from './types';

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can change this to your preferred email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use app password for Gmail
  },
});

interface RegistrationEmailData {
  participantName: string;
  participantEmail: string;
  event: Event;
  eventUrl: string;
}

export async function sendRegistrationEmail(data: RegistrationEmailData): Promise<void> {
  try {
    // Generate QR code for the event URL with better compatibility
    const qrCodeDataUrl = await QRCode.toDataURL(data.eventUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });

    console.log('QR Code generated successfully');

    // Create email HTML content with embedded QR code
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Event Registration Confirmation</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .event-details {
            background-color: #ffffff;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
          }
          .qr-section {
            text-align: center;
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .qr-code {
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #6c757d;
            font-size: 14px;
            margin-top: 30px;
          }
          .highlight {
            color: #22c55e;
            font-weight: bold;
            font-size: 20px;
          }
          .primary-color {
            color: #22c55e;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="cid:nimet-logo" alt="NiMet Logo" style="max-width: 150px; height: auto;">
          </div>
          <h1 class="primary-color">🎉 Registration Confirmed!</h1>
          <p style="font-size: 20px;">Dear <span class="highlight">${data.participantName}</span>,</p>
          <p>Your registration for the event has been successfully confirmed.</p>
        </div>

        <div class="event-details">
          <h2>Event Details</h2>
          <p><strong>Event Name:</strong> ${data.event.name}</p>
          <p><strong>Start Date:</strong> ${formatEventDate(data.event.startDate)}</p>
          <p><strong>End Date:</strong> ${formatEventDate(data.event.endDate)}</p>
          <p><strong>Location:</strong> ${data.event.location}</p>
          ${data.event.description ? `<p><strong>Description:</strong> ${data.event.description}</p>` : ''}
        </div>

        <div class="qr-section">
          <h3>📱 Quick Access QR Code</h3>
          <p>Scan this QR code to quickly access the event details:</p>
          <div class="qr-code">
            <img src="cid:qr-code" alt="Event QR Code" style="max-width: 200px;">
          </div>
          <p><strong>Event URL:</strong> <a href="${data.eventUrl}">${data.eventUrl}</a></p>
        </div>

        <div class="footer">
          <p>Thank you for registering with NiMet Events Portal!</p>
          <p>If you have any questions, please contact us.</p>
          <p>© 2025 Nigeria Meteorological Agency. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: data.participantEmail,
      subject: `Registration Confirmed: ${data.event.name}`,
      html: emailHtml,
      attachments: [
        {
          filename: 'nimet-logo.png',
          path: './public/nimet-logo.png',
          cid: 'nimet-logo', // Content ID for embedding
        },
        {
          filename: 'event-qr-code.png',
          content: qrCodeDataUrl.split(',')[1], // Remove data:image/png;base64, prefix
          encoding: 'base64',
          cid: 'qr-code', // Content ID for embedding
        },
      ],
    });

    console.log(`Registration email sent to ${data.participantEmail}`);
  } catch (error) {
    console.error('Error sending registration email:', error);
    throw new Error('Failed to send registration email');
  }
}

// Helper function to format event date
function formatEventDate(dateString: string): string {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    if (year && month && day) {
      const date = new Date(year, month - 1, day);
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      return date.toLocaleDateString('en-US', options);
    }
    return dateString;
  } catch (error) {
    return dateString;
  }
}
