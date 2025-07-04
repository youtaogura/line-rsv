import {
  adminReservationsApi,
  type AdminReservation,
  type ReservationsQueryParams,
} from '@/lib/api';
import { useCallback, useState } from 'react';

export const useAdminReservations = () => {
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReservations = useCallback(
    async (staffMemberId?: string, startDate?: string, endDate?: string) => {
      try {
        const params: ReservationsQueryParams = {};
        if (staffMemberId && staffMemberId !== 'all') {
          params.staff_member_id = staffMemberId;
        }
        if (startDate) {
          params.start_date = startDate;
        }
        if (endDate) {
          params.end_date = endDate;
        }

        const response = await adminReservationsApi.getReservations(params);

        if (response.success) {
          setReservations(response.data || []);
        } else {
          alert(response.error || '予約の取得に失敗しました');
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteReservation = async (reservationId: string) => {
    if (!confirm('この予約を削除しますか？')) return;

    try {
      const response = await adminReservationsApi.deleteReservation(reservationId);

      if (response.success) {
        setReservations(reservations.filter((r) => r.id !== reservationId));
        alert('予約を削除しました');
      } else {
        alert(response.error || '予約の削除に失敗しました');
      }
    } catch (error) {
      console.error('Delete reservation error:', error);
      alert('予約の削除に失敗しました');
    }
  };

  return {
    reservations,
    loading,
    fetchReservations,
    deleteReservation,
  };
};

export const useAdminRecentReservations = () => {
  const [recentReservations, setRecentReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentReservations = useCallback(async (limit: number = 5) => {
    try {
      setLoading(true);
      const response = await adminReservationsApi.getRecentReservations(limit);

      if (response.success) {
        setRecentReservations(response.data || []);
      } else {
        console.error('Error fetching recent reservations:', response.error);
        setRecentReservations([]);
      }
    } catch (error) {
      console.error('Fetch recent reservations error:', error);
      setRecentReservations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    recentReservations,
    loading,
    fetchRecentReservations,
  };
};

export const useAdminUnassignedReservations = () => {
  const [unassignedReservations, setUnassignedReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUnassignedReservations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminReservationsApi.getUnassignedReservations();

      if (response.success) {
        setUnassignedReservations(response.data || []);
      } else {
        console.error('Error fetching unassigned reservations:', response.error);
        setUnassignedReservations([]);
      }
    } catch (error) {
      console.error('Fetch unassigned reservations error:', error);
      setUnassignedReservations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    unassignedReservations,
    loading,
    fetchUnassignedReservations,
  };
};