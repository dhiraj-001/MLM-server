# Email Service Setup

This document explains how to configure the email service for the application.

## Overview

The email service uses the `nodemailer` library to send emails through a Gmail account. It is used for features like sending password reset emails to users.

## Configuration

To use the email service, you need to create a `.env` file in the `server` directory and add the following environment variables:

```
EMAIL_USER="your-gmail-address@gmail.com"
EMAIL_PASS="your-gmail-password-or-app-password"
EMAIL_FROM="your-gmail-address@gmail.com"
```

### Authentication

There are two ways to authenticate with your Gmail account, depending on whether you have 2-Step Verification enabled.

#### Option 1: Using 2-Step Verification (Recommended)

If you have 2-Step Verification enabled on your Google account, you **must** use an **App Password**. You cannot use your regular Google account password.

1.  **Generate an App Password:**
    *   Go to your Google Account settings: [https://myaccount.google.com/](https://myaccount.google.com/)
    *   Navigate to the "Security" section.
    *   Under "Signing in to Google," click on "App passwords." You may need to sign in again.
    *   At the bottom, click "Select app" and choose "Other (Custom name)".
    *   Give it a name (e.g., "MLM App") and click "Generate".
    *   The App Password is the 16-character code in the yellow bar.

2.  **Update your `.env` file:**
    *   Copy the 16-character App Password.
    *   In your `server/.env` file, set `EMAIL_PASS` to this App Password.

#### Option 2: Without 2-Step Verification

If you do not have 2-Step Verification enabled, you can use your regular Google account password for `EMAIL_PASS`. However, you **must** enable "Less Secure App Access" in your Google account settings.

**Warning:** This option is less secure and not recommended by Google.

1.  **Enable Less Secure App Access:**
    *   Go to [https://myaccount.google.com/lesssecureapps](https://myaccount.google.com/lesssecureapps)
    *   Turn on the "Allow less secure apps" setting.

2.  **Update your `.env` file:**
    *   In your `server/.env` file, set `EMAIL_PASS` to your regular Google account password.

## Summary

After following one of the authentication methods above and configuring your `server/.env` file, the email service should be ready to use.
