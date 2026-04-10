import { getSiteSettings } from './settings';
import { generateHtmlEmail } from '../../utils/emailTemplates';

export const sendEmail = async (to: string, subject: string, content: string) => {
  try {
    const settings = await getSiteSettings();
    if (!settings || !settings.smtpHost || !settings.smtpPort || !settings.smtpUser || !settings.smtpPass) {
      console.warn('SMTP settings are not configured. Email not sent.');
      return false;
    }

    const html = generateHtmlEmail(content, settings);

    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: [to],
        subject,
        html,
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpUser: settings.smtpUser,
        smtpPass: settings.smtpPass,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to send email');
    }

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};
