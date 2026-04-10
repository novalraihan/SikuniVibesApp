import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import rateLimit from 'express-rate-limit';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(firebaseConfig.firestoreDatabaseId)
  : getFirestore();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy for rate limiting behind reverse proxy
  app.set('trust proxy', 1);

  // Rate limiting to prevent spam
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Terlalu banyak permintaan dari IP ini, silakan coba lagi nanti.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply limiter to API routes
  app.use('/api/', limiter);
  app.use(express.json());

  // API Route for Midtrans Snap Token
  app.post('/api/payment/token', async (req, res) => {
    try {
      const { bookingId, amount, customerDetails, itemDetails } = req.body;

      // Ensure you have a MIDTRANS_SERVER_KEY in your environment variables
      const serverKey = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YOUR_SERVER_KEY_HERE';
      const encodedKey = Buffer.from(serverKey + ':').toString('base64');

      const payload = {
        transaction_details: {
          order_id: bookingId,
          gross_amount: amount,
        },
        customer_details: customerDetails,
        item_details: itemDetails,
      };

      const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Basic ${encodedKey}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error_messages?.[0] || 'Failed to get snap token');
      }

      res.json({ token: data.token });
    } catch (error: any) {
      console.error('Midtrans Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route for Midtrans Notification (Webhook)
  app.post('/api/payment/notification', async (req, res) => {
    try {
      const notification = req.body;
      console.log('Midtrans Notification received:', notification);

      const orderId = notification.order_id;
      const transactionStatus = notification.transaction_status;
      const fraudStatus = notification.fraud_status;

      let bookingStatus = 'PENDING';

      if (transactionStatus === 'capture') {
        if (fraudStatus === 'challenge') {
          bookingStatus = 'PENDING';
        } else if (fraudStatus === 'accept') {
          bookingStatus = 'PAID';
        }
      } else if (transactionStatus === 'settlement') {
        bookingStatus = 'PAID';
      } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
        bookingStatus = 'CANCELLED';
      } else if (transactionStatus === 'pending') {
        bookingStatus = 'PENDING';
      }

      console.log(`Order ID: ${orderId}, Status updated to: ${bookingStatus}`);
            const bookingRef = db.collection('bookings').doc(orderId);

      await db.runTransaction(async (t) => {
        const bookingDoc = await t.get(bookingRef);

        if (bookingDoc.exists) {
          const bookingData = bookingDoc.data();
          
          if (bookingStatus === 'CANCELLED' && bookingData?.status !== 'CANCELLED') {
            // If cancelled, remove booked dates from property
            const propertyId = bookingData?.propertyId;
            const checkInDate = bookingData?.checkInDate;
            const checkOutDate = bookingData?.checkOutDate;

            if (propertyId && checkInDate && checkOutDate) {
              const propertyRef = db.collection('properties').doc(propertyId);
              const propertyDoc = await t.get(propertyRef);

              if (propertyDoc.exists) {
                const propertyData = propertyDoc.data();
                const bookedDates = propertyData?.bookedDates || [];
                
                // Calculate dates to remove
                const datesToRemove: string[] = [];
                let currentDate = new Date(checkInDate);
                const end = new Date(checkOutDate);
                while (currentDate < end) {
                  datesToRemove.push(currentDate.toISOString().split('T')[0]);
                  currentDate.setDate(currentDate.getDate() + 1);
                }
                
                if (bookingData.unitIndex !== undefined && bookingData.unitIndex !== null) {
                  const currentUnitDates = propertyData?.unitBookedDates || {};
                  const unitDates = currentUnitDates[bookingData.unitIndex] || [];
                  const newUnitDates = unitDates.filter((date: string) => !datesToRemove.includes(date));
                  t.update(propertyRef, { [`unitBookedDates.${bookingData.unitIndex}`]: newUnitDates });
                } else {
                  const newBookedDates = bookedDates.filter((date: string) => !datesToRemove.includes(date));
                  t.update(propertyRef, { bookedDates: newBookedDates });
                }
              }
            }
          }

          // Handle Affiliate Commissions
          let commissionStatus = bookingData?.commissionStatus || 'pending';
          if (bookingData?.affiliateId && bookingData?.commissionAmount) {
            const affiliateRef = db.collection('users').doc(bookingData.affiliateId);

            if (bookingStatus === 'PAID' && bookingData.status === 'PENDING') {
              // Add to pending balance when paid
              t.update(affiliateRef, { 
                affiliatePendingBalance: admin.firestore.FieldValue.increment(bookingData.commissionAmount) 
              });
            } else if (bookingStatus === 'CANCELLED' && bookingData.status !== 'CANCELLED') {
              // Remove from pending if cancelled
              if (bookingData.status === 'PAID') {
                t.update(affiliateRef, { 
                  affiliatePendingBalance: admin.firestore.FieldValue.increment(-bookingData.commissionAmount) 
                });
              }
              commissionStatus = 'cancelled';
            }
          }

          t.update(bookingRef, { 
            status: bookingStatus, 
            commissionStatus,
            updatedAt: Date.now(),
            paymentResult: notification // Store the full notification for audit
          });

          // Trigger notification if user exists
          if (bookingData?.userId) {
            const notificationRef = db.collection('notifications').doc();
            t.set(notificationRef, {
              userId: bookingData.userId,
              title: bookingStatus === 'PAID' ? 'Pembayaran Berhasil' : 'Update Status Booking',
              message: bookingStatus === 'PAID' 
                ? `Pembayaran untuk booking ID ${orderId} telah berhasil dikonfirmasi.`
                : `Status booking Anda dengan ID ${orderId} telah diperbarui menjadi ${bookingStatus}.`,
              type: 'booking',
              isRead: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              link: `/profile`
            });
          }
        }
      });

      res.status(200).json({ status: 'success', message: 'Notification processed' });
    } catch (error: any) {
      console.error('Midtrans Notification Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route for Sending Email
  app.post('/api/email/send', async (req, res) => {
    try {
      const { to, subject, html, smtpHost, smtpPort, smtpUser, smtpPass } = req.body;

      if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
        return res.status(400).json({ error: 'Pengaturan SMTP belum lengkap. Silakan atur di menu Pengaturan.' });
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort),
        secure: Number(smtpPort) === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const mailOptions = {
        from: `"Sikunir Vibes" <${smtpUser}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
      };

      const info = await transporter.sendMail(mailOptions);
      res.json({ success: true, messageId: info.messageId });
    } catch (error: any) {
      console.error('Email Send Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Meta Tag Injection for SEO and Social Sharing
  const injectMetaTags = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const pathName = req.path;
    let title = 'Sikunir Vibes - Penginapan & Wisata Dieng';
    let description = 'Temukan penginapan terbaik dan destinasi wisata menarik di Dieng bersama Sikunir Vibes.';
    let image = 'https://images.unsplash.com/photo-1506744626753-eba7bc20d5ad?auto=format&fit=crop&q=80&w=1200';

    try {
      // Fetch site settings for default values
      const settingsDoc = await db.collection('settings').doc('site').get();
      const settings = settingsDoc.exists ? settingsDoc.data() : null;
      
      if (settings) {
        title = settings.siteName || title;
        description = settings.siteDescription || description;
        image = settings.heroBannerUrl || image;
      }

      if (pathName.startsWith('/properties/') || pathName.startsWith('/property/')) {
        const id = pathName.split('/')[2];
        const doc = await db.collection('properties').doc(id).get();
        if (doc.exists) {
          const data = doc.data();
          title = `${data?.name} - Rp ${data?.basePrice?.toLocaleString('id-ID')} | Sikunir Vibes`;
          description = data?.description?.substring(0, 160) || description;
          image = data?.images?.[0] || image;
        }
      } else if (pathName.startsWith('/attractions/')) {
        const id = pathName.split('/')[2];
        const doc = await db.collection('attractions').doc(id).get();
        if (doc.exists) {
          const data = doc.data();
          title = `${data?.name} - Destinasi Wisata Dieng | Sikunir Vibes`;
          description = data?.description?.substring(0, 160) || description;
          image = data?.images?.[0] || image;
        }
      } else if (pathName.startsWith('/promos/')) {
        const id = pathName.split('/')[2];
        const doc = await db.collection('promos').doc(id).get();
        if (doc.exists) {
          const data = doc.data();
          title = `${data?.title} - Promo Sikunir Vibes`;
          description = data?.description?.substring(0, 160) || description;
          image = data?.imageUrl || image;
        }
      } else if (pathName.startsWith('/tour-packages/')) {
        const id = pathName.split('/')[2];
        const doc = await db.collection('tour-packages').doc(id).get();
        if (doc.exists) {
          const data = doc.data();
          title = `${data?.name} - Paket Wisata Dieng | Sikunir Vibes`;
          description = data?.description?.substring(0, 160) || description;
          image = data?.images?.[0] || image;
        }
      }

      const templatePath = process.env.NODE_ENV === 'production' 
        ? path.join(process.cwd(), 'dist', 'index.html')
        : path.join(process.cwd(), 'index.html');

      if (!fs.existsSync(templatePath)) {
        return next();
      }

      let html = fs.readFileSync(templatePath, 'utf-8');

      if (process.env.NODE_ENV !== 'production' && (global as any).vite) {
        html = await (global as any).vite.transformIndexHtml(req.url, html);
      }

      const appUrl = process.env.APP_URL || `https://${req.get('host')}`;

      const metaTags = `
        <title>${title}</title>
        <meta name="description" content="${description}">
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${description}">
        <meta property="og:image" content="${image}">
        <meta property="og:url" content="${appUrl}${req.url}">
        <meta property="og:type" content="website">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${title}">
        <meta name="twitter:description" content="${description}">
        <meta name="twitter:image" content="${image}">
      `;

      // Replace existing title and meta tags if they exist, or insert before </head>
      html = html.replace(/<title>.*?<\/title>/, '');
      html = html.replace('</head>', `${metaTags}</head>`);

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (error) {
      console.error('Meta injection error:', error);
      next();
    }
  };

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    (global as any).vite = vite;
    app.use(vite.middlewares);
    
    // Use meta tag injection for specific routes
    app.get(['/', '/properties/:id', '/attractions/:id', '/promos/:id', '/tour-packages/:id'], injectMetaTags);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    
    // Use meta tag injection for specific routes
    app.get(['/', '/properties/:id', '/attractions/:id', '/promos/:id', '/tour-packages/:id'], injectMetaTags);
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
