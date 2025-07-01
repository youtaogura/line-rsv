import { useState, useEffect, useCallback } from 'react';
import type { ReservationMenu } from '@/lib/supabase';
import { adminApi } from '@/lib/api';

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
      const result = await adminApi.getAdminReservationMenu(tenantId);
      
      if (!result.success) {
        // 404エラーの場合はnullを設定（デフォルト動作）
        if (result.error?.includes('404')) {
          setReservationMenu(null);
          return;
        }
        throw new Error(result.error || 'Failed to fetch reservation menu');
      }

      setReservationMenu(result.data as ReservationMenu);
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
