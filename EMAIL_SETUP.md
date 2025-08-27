# Email Setup Guide

This application now includes email functionality that sends confirmation emails with QR codes when users register for events.

## Environment Variables Required

Add the following environment variables to your `.env.local` file:

```env
# Email Configuration (for Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here

# Application URL
NEXT_PUBLIC_BASE_URL=http://localhost:9002
```

## Gmail Setup Instructions

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Navigate to Security
   - Under "2-Step Verification", click on "App passwords"
   - Generate a new app password for "Mail"
   - Use this password in the `EMAIL_PASS` environment variable

## Email Features

- **Automatic sending** when users register for events
- **QR code generation** with the event URL embedded
- **Professional HTML email template** with event details
- **Responsive design** that works on mobile and desktop

## Email Content Includes

- Event name, dates, and location
- Participant's name and registration confirmation
- QR code for quick access to event details
- Direct link to the event page
- Professional styling and branding

## Troubleshooting

If emails are not being sent:

1. Check that all environment variables are set correctly
2. Verify your Gmail app password is correct
3. Check the server logs for email-related errors
4. Ensure your Gmail account allows "less secure app access" or use app passwords

## Customization

You can customize the email template by editing the `emailHtml` variable in `src/lib/email-service.ts`. The template includes:

- Custom styling with CSS
- Event details section
- QR code integration
- Professional footer
- Responsive design
