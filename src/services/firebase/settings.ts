import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';

const SETTINGS_DOC = 'settings/general';

export interface QnAItem {
  question: string;
  answer: string;
}

export interface HomePopupSettings {
  enabled: boolean;
  showOnce: boolean;
  imageUrl: string;
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
}

export interface SiteSettings {
  siteName?: string;
  siteDescription?: string;
  heroBannerUrl?: string;
  logoUrl?: string;
  profile?: string;
  rules?: string;
  contactPhone?: string;
  contactName?: string;
  contactAddress?: string;
  socialTiktok?: string;
  socialYoutube?: string;
  socialInstagram?: string;
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPass?: string;
  adminEmail?: string;
  emailTemplateInvoice?: string;
  emailTemplatePromo?: string;
  emailTemplateRegistration?: string;
  emailTemplateBooking?: string;
  emailTemplatePayment?: string;
  primaryColor?: string;
  qna?: QnAItem[];
  jeepCategoryIconUrl?: string;
  homePopup?: HomePopupSettings;
}

let settingsCache: SiteSettings | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getSiteSettings = async (): Promise<SiteSettings | null> => {
  const now = Date.now();
  if (settingsCache && (now - lastFetchTime < CACHE_DURATION)) {
    return settingsCache;
  }

  try {
    const docRef = doc(db, SETTINGS_DOC);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      settingsCache = snapshot.data() as SiteSettings;
      lastFetchTime = now;
      return settingsCache;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, SETTINGS_DOC);
    return null;
  }
};

export const updateSiteSettings = async (data: Partial<SiteSettings>): Promise<void> => {
  try {
    const docRef = doc(db, SETTINGS_DOC);
    await setDoc(docRef, data, { merge: true });
    settingsCache = null; // Invalidate cache
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, SETTINGS_DOC);
  }
};
