import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Reservation, ApiResponse, ReservationStatus } from '@/types';

class ReservationsService {
  private collectionName = 'reservations';

  /**
   * Get reservations with optional filters
   */
  async getReservations(filters?: {
    borrowerId?: string;
    ownerId?: string;
    status?: ReservationStatus;
  }): Promise<ApiResponse<Reservation[]>> {
    try {
      let q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc')
      );

      if (filters?.borrowerId) {
        q = query(q, where('borrowerId', '==', filters.borrowerId));
      }

      if (filters?.ownerId) {
        q = query(q, where('ownerId', '==', filters.ownerId));
      }

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      const querySnapshot = await getDocs(q);
      const reservations: Reservation[] = [];

      querySnapshot.forEach((doc) => {
        reservations.push({
          id: doc.id,
          ...doc.data(),
          startDate: doc.data().startDate?.toDate(),
          endDate: doc.data().endDate?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        } as Reservation);
      });

      return { data: reservations, success: true };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch reservations',
        success: false,
      };
    }
  }

  /**
   * Get reservation by ID
   */
  async getReservationById(id: string): Promise<ApiResponse<Reservation>> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const reservation = {
          id: docSnap.id,
          ...docSnap.data(),
          startDate: docSnap.data().startDate?.toDate(),
          endDate: docSnap.data().endDate?.toDate(),
          createdAt: docSnap.data().createdAt?.toDate(),
          updatedAt: docSnap.data().updatedAt?.toDate(),
        } as Reservation;

        return { data: reservation, success: true };
      } else {
        return { error: 'Reservation not found', success: false };
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch reservation',
        success: false,
      };
    }
  }

  /**
   * Create new reservation
   */
  async createReservation(
    reservationData: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<string>> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...reservationData,
        startDate: reservationData.startDate,
        endDate: reservationData.endDate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { data: docRef.id, success: true };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to create reservation',
        success: false,
      };
    }
  }

  /**
   * Update reservation status
   */
  async updateReservationStatus(
    id: string,
    status: ReservationStatus
  ): Promise<ApiResponse<void>> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        status,
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to update reservation',
        success: false,
      };
    }
  }

  /**
   * Update reservation
   */
  async updateReservation(
    id: string,
    updates: Partial<Omit<Reservation, 'id' | 'createdAt'>>
  ): Promise<ApiResponse<void>> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to update reservation',
        success: false,
      };
    }
  }

  /**
   * Delete reservation
   */
  async deleteReservation(id: string): Promise<ApiResponse<void>> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);

      return { success: true };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to delete reservation',
        success: false,
      };
    }
  }
}

export const reservationsService = new ReservationsService();