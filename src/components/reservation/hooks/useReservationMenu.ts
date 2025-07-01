import { useState, useEffect, useCallback } from 'react';
import type { ReservationMenu } from '@/lib/supabase';
import { buildApiUrl } from '@/lib/tenant-helpers';

interface UseReservationMenuReturn {
  reservationMenu: ReservationMenu | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useReservationMenu(
  tenantId: string | null
): UseReservationMenuReturn {
  const [reservationMenu, setReservationMenu] =
    useState<ReservationMenu | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReservationMenu = useCallback(async () => {
    if (!tenantId) {
      setReservationMenu(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        buildApiUrl('/api/admin/reservation-menu', tenantId)
      );

      if (!response.ok) {
        if (response.status === 404) {
          // メニューが見つからない場合はnullを設定（デフォルト動作）
          setReservationMenu(null);
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch reservation menu');
      }

      const data = await response.json();
      setReservationMenu(data);
    } catch (err) {
      console.error('Error fetching reservation menu:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setReservationMenu(null);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const refetch = useCallback(() => {
    fetchReservationMenu();
  }, [fetchReservationMenu]);

  useEffect(() => {
    fetchReservationMenu();
  }, [fetchReservationMenu]);

  return {
    reservationMenu,
    loading,
    error,
    refetch,
  };
}
