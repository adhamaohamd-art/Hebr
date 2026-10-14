import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BookFile } from '../types';

export const bookFileService = {
  /**
   * Fetches the digital book download link.
   * Firestore rules enforce that caller must be admin OR have entitlement of type 'book'.
   */
  async getBookFile(novelId: string): Promise<BookFile | null> {
    try {
      const snap = await getDoc(doc(db, 'bookFiles', novelId));
      if (!snap.exists()) return null;
      const data = snap.data();
      return {
        novelId,
        fileUrl: data.fileUrl || '',
        fileName: data.fileName || '',
        updatedAt: data.updatedAt,
      };
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('getBookFile notice:', err);
      }
      return null;
    }
  },

  /**
   * Saves or updates the digital book download link (Admin only).
   */
  async saveBookFile(novelId: string, fileUrl: string, fileName?: string): Promise<void> {
    const cleanUrl = fileUrl.trim();
    if (!cleanUrl.startsWith('https://')) {
      throw new Error('رابط التحميل يجب أن يبدأ بـ https://');
    }
    await setDoc(
      doc(db, 'bookFiles', novelId),
      {
        novelId,
        fileUrl: cleanUrl,
        fileName: (fileName || '').trim(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },

  /**
   * Deletes a book file entry.
   */
  async deleteBookFile(novelId: string): Promise<void> {
    await deleteDoc(doc(db, 'bookFiles', novelId));
  },
};
