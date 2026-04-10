import { collection, doc, getDocs, setDoc, updateDoc, query, where, orderBy, onSnapshot, arrayUnion, getDoc, increment } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';

const COLLECTION_NAME = 'chats';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'admin';
  text: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  userId: string;
  userName: string;
  status: 'bot' | 'human' | 'closed';
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  unreadAdminCount: number;
  unreadUserCount: number;
  botMessageCount: number;
}

export const createOrGetChatSession = async (userId: string, userName: string): Promise<ChatSession> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const existingSession = snapshot.docs.find(doc => {
        const data = doc.data() as ChatSession;
        return data.status === 'bot' || data.status === 'human';
      });
      
      if (existingSession) {
        return existingSession.data() as ChatSession;
      }
    }

    const docRef = doc(collection(db, COLLECTION_NAME));
    const newSession: ChatSession = {
      id: docRef.id,
      userId,
      userName,
      status: 'bot',
      messages: [{
        id: Date.now().toString(),
        sender: 'bot',
        text: 'Halo! Saya asisten virtual Dieng. Ada yang bisa saya bantu?',
        timestamp: Date.now()
      }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      unreadAdminCount: 0,
      unreadUserCount: 0,
      botMessageCount: 0,
    };
    
    await setDoc(docRef, newSession);
    return newSession;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
    throw error;
  }
};

export const addMessageToChat = async (chatId: string, message: Omit<ChatMessage, 'id'>) => {
  try {
    const chatRef = doc(db, COLLECTION_NAME, chatId);
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substring(7)
    };
    
    const isFromUser = message.sender === 'user';
    
    const updateData: any = {
      messages: arrayUnion(newMessage),
      updatedAt: Date.now(),
    };
    
    if (isFromUser) {
      updateData.unreadAdminCount = increment(1);
    } else {
      updateData.unreadUserCount = increment(1);
      if (message.sender === 'bot') {
        updateData.botMessageCount = increment(1);
      }
    }
    
    await updateDoc(chatRef, updateData);
    
    return newMessage;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, COLLECTION_NAME);
    throw error;
  }
};

export const updateChatStatus = async (chatId: string, status: ChatSession['status']) => {
  try {
    const chatRef = doc(db, COLLECTION_NAME, chatId);
    await updateDoc(chatRef, { status, updatedAt: Date.now() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, COLLECTION_NAME);
    throw error;
  }
};

export const markChatAsRead = async (chatId: string, isAdmin: boolean) => {
  try {
    const chatRef = doc(db, COLLECTION_NAME, chatId);
    if (isAdmin) {
      await updateDoc(chatRef, { unreadAdminCount: 0 });
    } else {
      await updateDoc(chatRef, { unreadUserCount: 0 });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, COLLECTION_NAME);
    throw error;
  }
};


