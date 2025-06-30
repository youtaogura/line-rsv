import { useState, useEffect, useCallback } from 'react';
import { DayAvailability } from '../types';
import { buildApiUrl } from '@/lib/tenant-helpers';

interface UseMonthlyAvailabilityReturn {
  availabilityData: DayAvailability[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMonthlyAvailability(
  year: number,
  month: number, // 1-indexed month
  tenantId: string | null
): UseMonthlyAvailabilityReturn {
  const [availabilityData, setAvailabilityData] = useState<DayAvailability[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = useCallback(async () => {
    if (!tenantId) {
      setError('Tenant ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        buildApiUrl(
          `/api/availability/monthly?year=${year}&month=${month}`,
          tenantId
        )
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch availability data');
      }

      const data = await response.json();
      setAvailabilityData(data);
    } catch (err) {
      console.error('Error fetching monthly availability:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setAvailabilityData([]);
    } finally {
      setLoading(false);
    }
  }, [year, month, tenantId]);

  const refetch = useCallback(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  return {
    availabilityData,
    loading,
    error,
    refetch,
  };
}
