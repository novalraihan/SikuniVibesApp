import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';

export const uploadImage = async (file: File, path: string): Promise<string> => {
  try {
    // Generate a unique filename to prevent overwriting
    const uniqueFilename = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const fullPath = path.endsWith('/') ? `${path}${uniqueFilename}` : `${path}/${uniqueFilename}`;
    
    const storageRef = ref(storage, fullPath);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch (error: any) {
    console.error('Error uploading image:', error);
    
    let errorMessage = error.message || 'Cek koneksi internet atau ukuran file.';
    
    if (errorMessage.includes('unauthorized') || errorMessage.includes('permission')) {
      errorMessage = 'Firebase Storage belum diaktifkan atau aturan keamanan (rules) memblokir akses. Silakan buka Firebase Console -> Storage -> Get Started, lalu ubah Rules menjadi "allow read, write: if true;" untuk sementara.';
    } else if (errorMessage.includes('bucket')) {
      errorMessage = 'Bucket Firebase Storage tidak ditemukan. Pastikan Storage sudah diaktifkan di Firebase Console.';
    }
    
    throw new Error(`Gagal mengunggah gambar: ${errorMessage}`);
  }
};
