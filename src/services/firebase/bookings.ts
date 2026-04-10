import { collection, doc, getDocs, setDoc, updateDoc, query, where, orderBy, runTransaction, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Booking, Property, TourPackage, AddOn } from '../../types';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';
import { createNotification } from './notifications';
import { sendEmail } from './email';
import { getSiteSettings } from './settings';

const BOOKINGS_COLLECTION = 'bookings';
const PROPERTIES_COLLECTION = 'properties';

const generateBookingId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'BK-';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

export const createBooking = async (
  bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>,
  bookedDateStrings: string[]
): Promise<string> => {
  try {
    const customId = generateBookingId();
    const bookingRef = doc(db, BOOKINGS_COLLECTION, customId);
    const propertyRef = doc(db, PROPERTIES_COLLECTION, bookingData.propertyId);
    
    let promoRef: any = null;
    if (bookingData.voucherCode) {
      const promosRef = collection(db, 'promos');
      const q = query(promosRef, where('code', '==', bookingData.voucherCode.toUpperCase()));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        promoRef = doc(db, 'promos', snapshot.docs[0].id);
      }
    }
    
    await runTransaction(db, async (transaction) => {
      const propertyDoc = await transaction.get(propertyRef);
      if (!propertyDoc.exists()) {
        throw new Error("Properti tidak ditemukan!");
      }
      
      let promoDoc: any = null;
      if (promoRef) {
        promoDoc = await transaction.get(promoRef);
      }
      
      const property = propertyDoc.data() as Property;
      
      // Check for overlapping dates
      const activeUnitsCount = property.units?.filter(u => u.isActive).length || 1;
      const hasOverlap = bookedDateStrings.some(date => {
        const count = property.bookedDates.filter(d => d === date).length;
        return count >= activeUnitsCount;
      });
      if (hasOverlap) {
        throw new Error("Tanggal sudah dibooking oleh orang lain.");
      }
      
      // Create booking
      const newBooking: any = {
        ...bookingData,
        id: bookingRef.id,
        status: 'PENDING',
        createdAt: Date.now(),
      };
      
      // Remove undefined fields to prevent Firestore errors
      Object.keys(newBooking).forEach(key => {
        if (newBooking[key] === undefined) {
          delete newBooking[key];
        }
      });
      
      transaction.set(bookingRef, newBooking as Booking);
      
      // Update property booked dates
      transaction.update(propertyRef, {
        bookedDates: [...property.bookedDates, ...bookedDateStrings]
      });

      // Update promo usage if applicable
      if (promoDoc && promoDoc.exists()) {
        const currentUsage = promoDoc.data().currentUsage || 0;
        transaction.update(promoRef, {
          currentUsage: currentUsage + 1
        });
      }
    });
    
    // Send notification to user
    if (bookingData.userId) {
      await createNotification({
        userId: bookingData.userId,
        title: 'Booking Berhasil Dibuat',
        message: `Booking Anda dengan ID ${bookingRef.id} berhasil dibuat. Silakan selesaikan pembayaran.`,
        type: 'booking',
        isRead: false
      }).catch(err => console.error("Failed to send notification", err));
    }

    // Send Email
    const emailToSend = bookingData.guestEmail || (bookingData.userId ? undefined : undefined); // We don't have user email here if logged in, unless we fetch it. But guestEmail is available for guests.
    // Actually, let's fetch user email if userId exists
    let userEmail = bookingData.guestEmail;
    let userName = bookingData.guestName;
    if (bookingData.userId && !userEmail) {
      const userDoc = await getDoc(doc(db, 'users', bookingData.userId));
      if (userDoc.exists()) {
        userEmail = userDoc.data().email;
        userName = userDoc.data().displayName || 'Tamu';
      }
    }

    if (userEmail) {
      getSiteSettings().then(async settings => {
        const propertyDoc = await getDoc(propertyRef);
        const property = propertyDoc.data() as Property;
        
        let tpPrice = 0;
        if (bookingData.tourPackageId) {
          const tpDoc = await getDoc(doc(db, 'tour-packages', bookingData.tourPackageId));
          if (tpDoc.exists()) tpPrice = tpDoc.data().price || 0;
        }

        let addOnsPrice = 0;
        if (bookingData.addOnIds && bookingData.addOnIds.length > 0) {
          for (const id of bookingData.addOnIds) {
            const addOnDoc = await getDoc(doc(db, 'add-ons', id));
            if (addOnDoc.exists()) addOnsPrice += addOnDoc.data().price || 0;
          }
        }

        const defaultBookingTemplate = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="color: #2563eb; margin: 0; font-size: 24px;">Konfirmasi Pesanan #{{bookingId}}</h2>
    </div>
    <p style="font-size: 16px;">Halo <strong>{{userName}}</strong>,</p>
    <p style="font-size: 16px;">Terima kasih telah memesan di Sikunir Vibes. Pesanan Anda untuk <strong>{{propertyName}}</strong> telah kami terima.</p>
    
    <div class="order-details">
      <h3 style="margin-top: 0; color: #1e293b; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Detail Pesanan</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #64748b;">Check-in</td><td style="padding: 8px 0; text-align: right; font-weight: bold;">{{checkIn}}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Check-out</td><td style="padding: 8px 0; text-align: right; font-weight: bold;">{{checkOut}}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Harga Dasar</td><td style="padding: 8px 0; text-align: right;">Rp {{basePrice}}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Paket Wisata</td><td style="padding: 8px 0; text-align: right;">Rp {{tourPackagePrice}}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Layanan Tambahan</td><td style="padding: 8px 0; text-align: right;">Rp {{addOnsPrice}}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Diskon</td><td style="padding: 8px 0; text-align: right; color: #10b981;">-Rp {{discountAmount}}</td></tr>
        <tr><td style="padding: 12px 0; color: #0f172a; font-weight: bold; border-top: 2px solid #e2e8f0;">Total Bayar</td><td style="padding: 12px 0; text-align: right; font-weight: bold; font-size: 18px; color: #2563eb; border-top: 2px solid #e2e8f0;">Rp {{totalAmount}}</td></tr>
      </table>
    </div>
    
    <p style="font-size: 16px;">Silakan lakukan pembayaran agar pesanan Anda dapat segera diproses.</p>
    <div style="margin: 30px 0; text-align: center;">
      <a href="https://sikunirvibes.com/cek-booking" class="button">Lihat Detail & Bayar</a>
    </div>
    <p style="font-size: 14px; color: #64748b; text-align: center; margin-top: 30px;">Terima kasih,<br/>Tim Sikunir Vibes</p>
`;

        const template = settings?.emailTemplateBooking || defaultBookingTemplate;
        let html = template
          .replace(/{{bookingId}}/g, bookingRef.id)
          .replace(/{{userName}}/g, userName || 'Tamu')
          .replace(/{{propertyName}}/g, property.name)
          .replace(/{{checkIn}}/g, new Date(bookingData.checkInDate).toLocaleDateString('id-ID'))
          .replace(/{{checkOut}}/g, new Date(bookingData.checkOutDate).toLocaleDateString('id-ID'))
          .replace(/{{basePrice}}/g, (property.basePrice || 0).toLocaleString('id-ID'))
          .replace(/{{tourPackagePrice}}/g, tpPrice.toLocaleString('id-ID'))
          .replace(/{{addOnsPrice}}/g, addOnsPrice.toLocaleString('id-ID'))
          .replace(/{{discountAmount}}/g, (bookingData.discountAmount || 0).toLocaleString('id-ID'))
          .replace(/{{totalAmount}}/g, bookingData.totalAmount.toLocaleString('id-ID'));
        
        sendEmail(userEmail, `Konfirmasi Pesanan #${bookingRef.id}`, html);
        
        // Send email to admin
        if (settings?.adminEmail) {
          const adminHtml = `
            <h2>Booking Baru #${bookingRef.id}</h2>
            <p>Terdapat booking baru dari <strong>${userName}</strong> untuk properti <strong>${property.name}</strong>.</p>
            <ul>
              <li>Check-in: ${new Date(bookingData.checkInDate).toLocaleDateString('id-ID')}</li>
              <li>Check-out: ${new Date(bookingData.checkOutDate).toLocaleDateString('id-ID')}</li>
              <li>Total: Rp ${bookingData.totalAmount.toLocaleString('id-ID')}</li>
            </ul>
            <p>Silakan cek dashboard admin untuk detail lebih lanjut.</p>
          `;
          sendEmail(settings.adminEmail, `[Sikunir Vibes] Booking Baru #${bookingRef.id}`, adminHtml);
        }
      }).catch(err => console.error("Failed to send email", err));
    }

    return bookingRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, BOOKINGS_COLLECTION);
    throw error; // Re-throw to be handled by the UI
  }
};

export const getUserBookings = async (userId: string): Promise<Booking[]> => {
  try {
    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const bookings = snapshot.docs.map(doc => doc.data() as Booking);
    return bookings.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, BOOKINGS_COLLECTION);
    return [];
  }
};

export const getAllBookings = async (): Promise<Booking[]> => {
  try {
    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Booking);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, BOOKINGS_COLLECTION);
    return [];
  }
};

export const clearExpiredPendingBookings = async (): Promise<void> => {
  try {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where('status', '==', 'PENDING')
    );
    
    const snapshot = await getDocs(q);
    
    for (const bookingDoc of snapshot.docs) {
      const booking = bookingDoc.data() as Booking;
      if (booking.createdAt < oneHourAgo) {
        await updateBookingStatus(bookingDoc.id, 'CANCELLED');
      }
    }
  } catch (error) {
    console.error("Error clearing expired bookings:", error);
  }
};

export const updateBookingStatus = async (bookingId: string, status: Booking['status']): Promise<void> => {
  try {
    const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    let userId = '';
    
    await runTransaction(db, async (transaction) => {
      const bookingDoc = await transaction.get(bookingRef);
      if (!bookingDoc.exists()) return;
      
      const booking = bookingDoc.data() as Booking;
      userId = booking.userId || '';
      
      // --- READS ---
      let propertyDoc = null;
      let propertyRef = null;
      if (status === 'CANCELLED') {
        propertyRef = doc(db, PROPERTIES_COLLECTION, booking.propertyId);
        propertyDoc = await transaction.get(propertyRef);
      }

      let affiliateDoc = null;
      let affiliateRef = null;
      if (booking.affiliateId && booking.commissionAmount) {
        affiliateRef = doc(db, 'users', booking.affiliateId);
        affiliateDoc = await transaction.get(affiliateRef);
      }
      
      // --- WRITES ---
      const updates: any = { status, updatedAt: Date.now() };

      if (status === 'CANCELLED' && propertyDoc && propertyDoc.exists() && propertyRef) {
        const property = propertyDoc.data() as Property;
        
        // Calculate dates to remove
        const datesToRemove: string[] = [];
        let currentDate = new Date(booking.checkInDate);
        const end = new Date(booking.checkOutDate);
        while (currentDate < end) {
          datesToRemove.push(currentDate.toISOString().split('T')[0]);
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        const newBookedDates = property.bookedDates.filter(date => !datesToRemove.includes(date));
        
        transaction.update(propertyRef, {
          bookedDates: newBookedDates
        });
      }

      // Handle Affiliate Commissions
      if (affiliateDoc && affiliateDoc.exists() && affiliateRef) {
        const affiliateData = affiliateDoc.data();
        let newPending = affiliateData.affiliatePendingBalance || 0;
        let newBalance = affiliateData.affiliateBalance || 0;

        if (status === 'PAID' && booking.status === 'PENDING') {
          // Add to pending balance when paid
          newPending += booking.commissionAmount;
          transaction.update(affiliateRef, { affiliatePendingBalance: newPending });
        } else if (status === 'COMPLETED' && booking.status !== 'COMPLETED') {
          // Move from pending to ready balance when completed
          if (booking.status === 'PAID') {
            newPending = Math.max(0, newPending - booking.commissionAmount);
          }
          newBalance += booking.commissionAmount;
          updates.commissionStatus = 'ready';
          transaction.update(affiliateRef, { 
            affiliatePendingBalance: newPending,
            affiliateBalance: newBalance 
          });
        } else if (status === 'CANCELLED' && booking.status !== 'CANCELLED') {
          // Remove from pending if cancelled
          if (booking.status === 'PAID') {
            newPending = Math.max(0, newPending - booking.commissionAmount);
            transaction.update(affiliateRef, { affiliatePendingBalance: newPending });
          }
          updates.commissionStatus = 'cancelled';
        }
      }
      
      transaction.update(bookingRef, updates);
    });

    // Send notification and email
    if (userId || status === 'PAID' || status === 'CANCELLED') {
      let title = '';
      let message = '';
      
      if (status === 'PAID') {
        title = 'Payment Successful';
        message = `Pembayaran untuk booking ID ${bookingId} telah berhasil dikonfirmasi.`;
      } else if (status === 'CANCELLED') {
        title = 'Booking Cancelled';
        message = `Booking Anda dengan ID ${bookingId} telah dibatalkan.`;
      }

      if (title && message && userId) {
        await createNotification({
          userId,
          title,
          message,
          type: 'booking',
          isRead: false
        }).catch(err => console.error("Failed to send notification", err));
      }

      // Send Email
      const bookingDoc = await getDoc(bookingRef);
      if (bookingDoc.exists()) {
        const booking = bookingDoc.data() as Booking;
        let userEmail = booking.guestEmail;
        let userName = booking.guestName;
        
        if (booking.userId && !userEmail) {
          const userDoc = await getDoc(doc(db, 'users', booking.userId));
          if (userDoc.exists()) {
            userEmail = userDoc.data().email;
            userName = userDoc.data().displayName || 'Tamu';
          }
        }

        if (userEmail && status === 'PAID') {
          getSiteSettings().then(settings => {
            const defaultPaymentTemplate = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="color: #059669; margin: 0; font-size: 24px;">Pembayaran Berhasil!</h2>
    </div>
    <p style="font-size: 16px;">Halo <strong>{{userName}}</strong>,</p>
    <p style="font-size: 16px;">Pembayaran untuk pesanan <strong>#{{bookingId}}</strong> telah berhasil kami verifikasi.</p>
    <p style="font-size: 16px;">Status pesanan Anda saat ini adalah: <strong style="color: #059669;">{{status}}</strong>.</p>
    <div style="margin: 30px 0; text-align: center;">
      <a href="https://sikunirvibes.com/cek-booking" class="button">Cek Status Pesanan</a>
    </div>
    <p style="font-size: 14px; color: #64748b; text-align: center; margin-top: 30px;">Terima kasih telah mempercayakan akomodasi Anda kepada kami!<br/>Tim Sikunir Vibes</p>
`;
            const template = settings?.emailTemplatePayment || defaultPaymentTemplate;
            let html = template
              .replace(/{{bookingId}}/g, bookingId)
              .replace(/{{userName}}/g, userName || 'Tamu')
              .replace(/{{status}}/g, status);
            sendEmail(userEmail!, `Informasi Pembayaran Diterima #${bookingId}`, html);
          }).catch(err => console.error("Failed to send email", err));
        }

        if (status === 'CANCELLED') {
          getSiteSettings().then(settings => {
            if (userEmail) {
              const cancelHtml = `
                <div style="text-align: center; margin-bottom: 20px;">
                  <h2 style="color: #dc2626; margin: 0; font-size: 24px;">Pesanan Dibatalkan</h2>
                </div>
                <p style="font-size: 16px;">Halo <strong>${userName}</strong>,</p>
                <p style="font-size: 16px;">Pesanan Anda dengan ID <strong>#${bookingId}</strong> telah dibatalkan.</p>
                <p style="font-size: 16px;">Jika Anda memiliki pertanyaan, silakan hubungi kami.</p>
                <p style="font-size: 14px; color: #64748b; text-align: center; margin-top: 30px;">Terima kasih,<br/>Tim Sikunir Vibes</p>
              `;
              sendEmail(userEmail, `Pesanan Dibatalkan #${bookingId}`, cancelHtml);
            }
            
            if (settings?.adminEmail) {
              const adminCancelHtml = `
                <h2>Booking Dibatalkan #${bookingId}</h2>
                <p>Booking atas nama <strong>${userName}</strong> telah dibatalkan.</p>
                <p>Silakan cek dashboard admin untuk detail lebih lanjut.</p>
              `;
              sendEmail(settings.adminEmail, `[Sikunir Vibes] Booking Dibatalkan #${bookingId}`, adminCancelHtml);
            }
          }).catch(err => console.error("Failed to send email", err));
        }
      }
    }

    // Send Affiliate Notification
    if (status === 'PAID' || status === 'COMPLETED') {
      const bookingDoc = await getDoc(bookingRef);
      if (bookingDoc.exists()) {
        const booking = bookingDoc.data() as Booking;
        if (booking.affiliateId && booking.commissionAmount) {
          const title = status === 'PAID' ? 'Komisi Tertunda Baru!' : 'Komisi Berhasil Cair!';
          const message = status === 'PAID' 
            ? `Anda mendapatkan komisi tertunda sebesar Rp ${booking.commissionAmount.toLocaleString('id-ID')} dari pesanan ${bookingId}.`
            : `Komisi sebesar Rp ${booking.commissionAmount.toLocaleString('id-ID')} dari pesanan ${bookingId} telah masuk ke saldo Anda.`;
          
          await createNotification({
            userId: booking.affiliateId,
            title,
            message,
            type: 'affiliate',
            isRead: false
          }).catch(err => console.error("Failed to send affiliate notification", err));
        }
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, BOOKINGS_COLLECTION);
    throw error;
  }
};
