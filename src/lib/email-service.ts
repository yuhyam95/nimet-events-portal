import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import type { Event, Participant } from './types';
import { generateQRCode } from './qr-generator';

// Email configuration (Office365 / Standard SMTP)
const getFromAddress = () => {
  return process.env.SMTP_FROM || process.env.EMAIL_USER || 'support@nimetagency.org.ng';
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.office365.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURITY === 'ssl' || Number(process.env.SMTP_PORT) === 465, // false for port 587 STARTTLS
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER || 'support@nimetagency.org.ng',
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
});

interface RegistrationEmailData {
  participantName: string;
  participantEmail: string;
  event: Event;
  eventUrl: string;
}

interface AttendanceQREmailData {
  participant: Participant;
  event: Event;
}

interface FollowUpEmailData {
  participant: Participant;
  event: Event;
  message?: string;
  surveyLink?: string;
  qrCodeImage?: File;
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
      from: getFromAddress(),
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

export async function sendAttendanceQREmail(data: AttendanceQREmailData): Promise<void> {
  try {
    console.log('sendAttendanceQREmail called with participant:', data.participant);
    console.log('Participant ID:', data.participant.id);

    // Generate attendance QR code using our custom generator
    // Use id field (same as View QR Code button)
    const participantId = data.participant.id;
    console.log('Using participant ID for QR code:', participantId);
    const qrCodeDataUrl = await generateQRCode(participantId);

    console.log('Attendance QR Code generated successfully');

    // Create email HTML content with embedded QR code
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Attendance QR Code - ${data.event.name}</title>
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
          .instructions {
            background-color: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
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
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="cid:nimet-logo" alt="NiMet Logo" style="max-width: 150px; height: auto;">
          </div>
          <h1 class="primary-color">📱 Your Attendance QR Code</h1>
          <p style="font-size: 20px;">Dear <span class="highlight">${data.participant.name}</span>,</p>
          <p>Your attendance QR code for the event is ready!</p>
        </div>

        <div class="event-details">
          <h2>Event Details</h2>
          <p><strong>Event Name:</strong> ${data.event.name}</p>
          <p><strong>Start Date:</strong> ${formatEventDate(data.event.startDate)}</p>
          <p><strong>End Date:</strong> ${formatEventDate(data.event.endDate)}</p>
          <p><strong>Location:</strong> ${data.event.location}</p>
          <p><strong>Your Organization:</strong> ${data.participant.organization}</p>
        </div>

        <div class="qr-section">
          <h3>🎯 Your Personal Attendance QR Code</h3>
          <p>Present this QR code at the event entrance for quick check-in:</p>
          <div class="qr-code">
            <img src="cid:attendance-qr" alt="Attendance QR Code" style="max-width: 250px; border: 2px solid #ddd; border-radius: 8px;">
          </div>
          <p><strong>Participant ID:</strong> ${participantId}</p>
        </div>

        <div class="instructions">
          <h4>📋 How to Use Your QR Code:</h4>
          <ol>
            <li><strong>Save this email</strong> or take a screenshot of the QR code</li>
            <li><strong>Bring your phone</strong> or a printed copy to the event</li>
            <li><strong>Present the QR code</strong> to the event staff for scanning</li>
            <li><strong>Your attendance will be automatically recorded</strong></li>
          </ol>
        </div>

        <div class="warning">
          <h4>⚠️ Important Notes:</h4>
          <ul>
            <li>This QR code is unique to you and this specific event</li>
            <li>Do not share your QR code with others</li>
            <li>Keep your QR code secure until the event</li>
            <li>If you lose this email, contact the event organizers</li>
          </ul>
        </div>

        <div class="footer">
          <p>Thank you for participating in NiMet Events!</p>
          <p>If you have any questions, please contact the event organizers.</p>
          <p>© 2025 Nigeria Meteorological Agency. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    // Send email
    await transporter.sendMail({
      from: getFromAddress(),
      to: data.participant.contact.toLowerCase().trim(),
      subject: `Your Attendance QR Code - ${data.event.name}`,
      html: emailHtml,
      attachments: [
        {
          filename: 'nimet-logo.png',
          path: './public/nimet-logo.png',
          cid: 'nimet-logo', // Content ID for embedding
        },
        {
          filename: 'attendance-qr-code.png',
          content: qrCodeDataUrl.split(',')[1], // Remove data:image/png;base64, prefix
          encoding: 'base64',
          cid: 'attendance-qr', // Content ID for embedding
        },
      ],
    });

    console.log(`Attendance QR email sent to ${data.participant.contact}`);
  } catch (error) {
    console.error('Error sending attendance QR email:', error);
    throw new Error('Failed to send attendance QR email');
  }
}

export async function sendFollowUpEmail(data: FollowUpEmailData): Promise<void> {
  try {
    console.log('sendFollowUpEmail called with participant:', data.participant);
    console.log('Event:', data.event);

    // Create email HTML content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Follow-up: ${data.event.name}</title>
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
          .message-section {
            background-color: #e3f2fd;
            border-left: 4px solid #22c55e;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
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
          .cta-button {
            display: inline-block;
            background-color: #22c55e;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
          }
          .cta-button:hover {
            background-color: #16a34a;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="cid:nimet-logo" alt="NiMet Logo" style="max-width: 150px; height: auto;">
          </div>
          <h1 class="primary-color">🎉 Thank You for Attending!</h1>
          <p style="font-size: 20px;">Dear <span class="highlight">${data.participant.name}</span>,</p>
          <p>Thank you for your participation in our event <strong>${data.event.name}</strong>!</p>
        </div>

        <div class="event-details">
          <h2>Event Summary</h2>
          <p><strong>Event Name:</strong> ${data.event.name}</p>
          <p><strong>Event Date:</strong> ${formatEventDate(data.event.startDate)}${data.event.startDate !== data.event.endDate ? ` - ${formatEventDate(data.event.endDate)}` : ''}</p>
          <p><strong>Location:</strong> ${data.event.location}</p>
          ${data.event.description ? `<p><strong>Description:</strong> ${data.event.description}</p>` : ''}
        </div>

        ${data.message ? `
        <div class="message-section">
          <!-- <h3>📝 Additional Message</h3> -->
          <p>${data.message}</p>
        </div>
        ` : ''}

        ${data.surveyLink ? `
        <div style="text-align: center; margin: 30px 0; background-color: #f0f9ff; padding: 20px; border-radius: 8px; border: 2px solid #22c55e;">
          <h3 style="color: #22c55e;">📊 Help Us Improve!</h3>
          <p>Your feedback is valuable to us. Please take a few minutes to complete our post-event survey:</p>
          <a href="${data.surveyLink}" class="cta-button" style="background-color: #22c55e; color: white; margin: 15px 0;">Complete Survey</a>
          ${data.qrCodeImage ? `
          <div style="margin-top: 20px;">
            <p style="font-size: 14px; color: #666; margin-bottom: 10px;">Or scan this QR code to access the survey form:</p>
            <img src="cid:survey-qr-code" alt="Survey QR Code" style="max-width: 150px; height: auto; border: 2px solid #22c55e; border-radius: 8px;">
          </div>
          ` : ''}
          <p style="font-size: 14px; color: #666; margin-top: 10px;">This survey will help us improve future events and better serve our participants.</p>
        </div>
        ` : ''}

        <div class="footer">
          <p>Thank you for participating in NiMet Events!</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>© 2025 Nigeria Meteorological Agency. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    // Prepare attachments
    const attachments = [
      {
        filename: 'nimet-logo.png',
        path: './public/nimet-logo.png',
        cid: 'nimet-logo', // Content ID for embedding
      },
    ];

    // Add QR code image if provided
    if (data.qrCodeImage) {
      const qrCodeBuffer = Buffer.from(await data.qrCodeImage.arrayBuffer());
      attachments.push({
        filename: 'survey-qr-code.png',
        content: qrCodeBuffer,
        cid: 'survey-qr-code', // Content ID for embedding
      } as any);
    }

    // Send email
    await transporter.sendMail({
      from: getFromAddress(),
      to: data.participant.contact.toLowerCase().trim(),
      subject: `Thank You for Attending: ${data.event.name}`,
      html: emailHtml,
      attachments: attachments,
    });

    console.log(`Follow-up email sent to ${data.participant.contact}`);
  } catch (error) {
    console.error('Error sending follow-up email:', error);
    throw new Error('Failed to send follow-up email');
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

// ─── Invitation Email ─────────────────────────────────────────────────────────

interface InvitationEmailData {
  inviteeName: string;
  inviteeEmail: string;
  invitationCode: string;
  event: Event;
}

/**
 * Send a personal invitation email to an invitee with their unique QR code and text code.
 */
export async function sendInvitationEmail(data: InvitationEmailData): Promise<void> {
  try {
    // Generate a QR code for the invitation code itself
    const qrCodeDataUrl = await QRCode.toDataURL(data.invitationCode, {
      width: 220,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#006B3E',
        light: '#FFFFFF',
      },
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Invitation – ${data.event.name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }
          .card {
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }
          .header {
            background: linear-gradient(135deg, #006B3E 0%, #00994f 100%);
            padding: 32px 24px;
            text-align: center;
          }
          .header img { max-width: 140px; height: auto; margin-bottom: 16px; }
          .header h1 { color: #ffffff; margin: 0; font-size: 22px; }
          .header p { color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px; }
          .body { padding: 28px 24px; }
          .greeting { font-size: 17px; margin-bottom: 16px; }
          .event-box {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
          }
          .event-box p { margin: 4px 0; font-size: 14px; }
          .event-box strong { color: #166534; }
          .code-section {
            text-align: center;
            background: #f8fafc;
            border: 2px dashed #006B3E;
            border-radius: 12px;
            padding: 24px 16px;
            margin-bottom: 24px;
          }
          .code-section h3 { margin: 0 0 12px; color: #006B3E; font-size: 16px; }
          .code-section img { border-radius: 8px; border: 2px solid #006B3E; }
          .code-badge {
            display: inline-block;
            font-family: 'Courier New', monospace;
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 6px;
            color: #006B3E;
            background: #ffffff;
            border: 2px solid #006B3E;
            border-radius: 8px;
            padding: 10px 20px;
            margin-top: 16px;
          }
          .instructions {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 14px 16px;
            border-radius: 4px;
            margin-bottom: 20px;
            font-size: 13px;
          }
          .instructions h4 { margin: 0 0 8px; color: #1d4ed8; }
          .instructions ol { margin: 0; padding-left: 18px; }
          .instructions li { margin-bottom: 4px; }
          .warning {
            background: #fffbeb;
            border: 1px solid #fcd34d;
            border-radius: 8px;
            padding: 12px 16px;
            font-size: 13px;
            color: #92400e;
          }
          .footer {
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
            padding: 20px 24px;
            border-top: 1px solid #f3f4f6;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <img src="cid:nimet-logo" alt="NiMet Logo" />
            <h1>You're Invited!</h1>
            <p>${data.event.name}</p>
          </div>

          <div class="body">
            <p class="greeting">Dear <strong>${data.inviteeName}</strong>,</p>
            <p>You have been personally invited to attend the following event. Please find your unique invitation code below — keep it safe and bring it to the event.</p>

            <div class="event-box">
              <p><strong>Event:</strong> ${data.event.name}</p>
              <p><strong>Date:</strong> ${formatEventDate(data.event.startDate)}${data.event.startDate !== data.event.endDate ? ` – ${formatEventDate(data.event.endDate)}` : ''}</p>
              <p><strong>Venue:</strong> ${data.event.location}</p>
              ${data.event.description ? `<p><strong>Theme:</strong> ${data.event.description}</p>` : ''}
            </div>

            <div class="code-section">
              <h3>🎫 Your Personal Invitation Code</h3>
              <img src="cid:invitation-qr" alt="Invitation QR Code" width="180" height="180" />
              <br/>
              <span class="code-badge">${data.invitationCode}</span>
            </div>

            <div class="instructions">
              <h4>📋 How to use your code at registration:</h4>
              <ol>
                <li><strong>Scan</strong> the QR code above using your phone camera, <em>or</em></li>
                <li><strong>Type</strong> the code <strong>${data.invitationCode}</strong> on the registration form</li>
                <li>Your details will <strong>auto-fill</strong> — just confirm and submit</li>
                <li>You will receive a separate QR pass for event entry</li>
              </ol>
            </div>

            <div class="warning">
              ⚠️ <strong>Important:</strong> This code is unique to you and can only be used once. Do not share it with others.
            </div>
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} Nigeria Meteorological Agency (NiMet). All rights reserved.</p>
            <p>If you believe you received this in error, please disregard this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: getFromAddress(),
      to: data.inviteeEmail,
      subject: `Your Invitation to ${data.event.name}`,
      html: emailHtml,
      attachments: [
        {
          filename: 'nimet-logo.png',
          path: './public/nimet-logo.png',
          cid: 'nimet-logo',
        },
        {
          filename: 'invitation-qr.png',
          content: qrCodeDataUrl.split(',')[1],
          encoding: 'base64',
          cid: 'invitation-qr',
        },
      ],
    });

    console.log(`Invitation email sent to ${data.inviteeEmail} with code ${data.invitationCode}`);
  } catch (error) {
    console.error('Error sending invitation email:', error);
    throw new Error('Failed to send invitation email');
  }
}
