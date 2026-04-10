import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';

export interface LogEntry {
  id?: string;
  type: 'booking' | 'user' | 'affiliate' | 'system';
  title: string;
  description: string;
  date: number;
  status: 'success' | 'warning' | 'error' | 'info';
}

export const createLog = async (log: Omit<LogEntry, 'id' | 'date'>) => {
  try {
    const logsRef = collection(db, 'logs');
    await addDoc(logsRef, {
      ...log,
      date: Date.now()
    });
  } catch (error) {
    console.error('Error creating log:', error);
  }
};

export const getLogs = async (limitCount = 100) => {
  try {
    const logsRef = collection(db, 'logs');
    const q = query(logsRef, orderBy('date', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LogEntry));
  } catch (error) {
    console.error('Error fetching logs:', error);
    return [];
  }
};
