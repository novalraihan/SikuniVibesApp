import { SiteSettings } from '../services/firebase/settings';

export const generateHtmlEmail = (content: string, settings: SiteSettings | null) => {
  const logoUrl = settings?.logoUrl || 'https://picsum.photos/seed/logo/200/50';
  const primaryColor = '#0066FF';
  const accentColor = '#FF5A1F';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f7fa;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    }
    .header {
      background-color: #ffffff;
      padding: 30px;
      text-align: center;
      border-bottom: 1px solid #eeeeee;
    }
    .logo {
      max-height: 50px;
      width: auto;
    }
    .content {
      padding: 40px 30px;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      font-size: 12px;
      color: #999;
      border-top: 1px solid #eeeeee;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: ${primaryColor};
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 12px;
      font-weight: bold;
      margin-top: 25px;
      box-shadow: 0 4px 10px rgba(0, 102, 255, 0.2);
      transition: all 0.3s ease;
    }
    .button:hover {
      background-color: #0052cc;
      transform: translateY(-2px);
    }
    .order-details {
      background-color: #f8fafc;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      border: 1px solid #e2e8f0;
    }
    .order-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 14px;
    }
    .order-total {
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      margin-top: 10px;
      font-weight: bold;
      font-size: 16px;
      color: ${primaryColor};
    }
    h2 {
      color: #1a202c;
      margin-top: 0;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .badge-paid { background-color: #def7ec; color: #03543f; }
    .badge-pending { background-color: #fef3c7; color: #92400e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="Logo" class="logo">
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${settings?.siteName || 'Sikunir Vibes'}. All rights reserved.</p>
      <p>${settings?.contactAddress || 'Dieng, Wonosobo, Jawa Tengah'}</p>
      <div style="margin-top: 15px;">
        <a href="#" style="color: #999; text-decoration: none; margin: 0 10px;">Website</a>
        <a href="#" style="color: #999; text-decoration: none; margin: 0 10px;">Instagram</a>
        <a href="#" style="color: #999; text-decoration: none; margin: 0 10px;">WhatsApp</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};
