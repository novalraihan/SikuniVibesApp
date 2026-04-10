import { collection, doc, getDocs, setDoc, updateDoc, query, where, orderBy, runTransaction } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Withdrawal, User } from '../../types';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';

const WITHDRAWALS_COLLECTION = 'withdrawals';
const USERS_COLLECTION = 'users';

export const createWithdrawal = async (withdrawalData: Omit<Withdrawal, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> => {
  try {
    let newId = '';
    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, USERS_COLLECTION, withdrawalData.affiliateId);
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) throw new Error("Affiliate tidak ditemukan");
      
      const user = userDoc.data() as User;
      const currentBalance = user.affiliateBalance || 0;
      
      if (currentBalance < withdrawalData.amount) {
        throw new Error("Saldo tidak mencukupi");
      }
      
      const withdrawalRef = doc(collection(db, WITHDRAWALS_COLLECTION));
      newId = withdrawalRef.id;
      
      const newWithdrawal: Withdrawal = {
        ...withdrawalData,
        id: withdrawalRef.id,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      transaction.set(withdrawalRef, newWithdrawal);
      transaction.update(userRef, {
        affiliateBalance: currentBalance - withdrawalData.amount
      });
    });
    return newId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, WITHDRAWALS_COLLECTION);
    throw error;
  }
};

export const getWithdrawalsByAffiliate = async (affiliateId: string): Promise<Withdrawal[]> => {
  try {
    const q = query(
      collection(db, WITHDRAWALS_COLLECTION),
      where('affiliateId', '==', affiliateId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Withdrawal);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, WITHDRAWALS_COLLECTION);
    return [];
  }
};

export const getAllWithdrawals = async (): Promise<Withdrawal[]> => {
  try {
    const q = query(
      collection(db, WITHDRAWALS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Withdrawal);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, WITHDRAWALS_COLLECTION);
    return [];
  }
};

export const updateWithdrawalStatus = async (withdrawalId: string, status: 'approved' | 'rejected' | 'completed'): Promise<void> => {
  try {
    const withdrawalRef = doc(db, WITHDRAWALS_COLLECTION, withdrawalId);
    
    await runTransaction(db, async (transaction) => {
      const withdrawalDoc = await transaction.get(withdrawalRef);
      if (!withdrawalDoc.exists()) throw new Error("Penarikan tidak ditemukan");
      
      const withdrawal = withdrawalDoc.data() as Withdrawal;
      
      if (status === 'completed') {
        if (withdrawal.status !== 'approved') throw new Error("Hanya penarikan yang disetujui yang dapat diselesaikan");
      } else {
        if (withdrawal.status !== 'pending') throw new Error("Status penarikan sudah berubah");
      }

      if (status === 'rejected') {
        const userRef = doc(db, USERS_COLLECTION, withdrawal.affiliateId);
        const userDoc = await transaction.get(userRef);
        if (userDoc.exists()) {
          const user = userDoc.data() as User;
          transaction.update(userRef, {
            affiliateBalance: (user.affiliateBalance || 0) + withdrawal.amount
          });
        }
      }
      
      transaction.update(withdrawalRef, { 
        status, 
        updatedAt: Date.now() 
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, WITHDRAWALS_COLLECTION);
    throw error;
  }
};
