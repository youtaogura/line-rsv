import { useState, useEffect, useCallback } from 'react';
import { DayAvailability } from '../types';
import { MonthlyAvailability } from '@/app/api/public/availability/monthly/route';
import { availabilityApi } from '@/lib/api';

interface UseMonthlyAvailabilityReturn {
  availabilityData: DayAvailability[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Convert MonthlyAvailability to DayAvailability[]
function convertToDateAvailability(monthlyData: MonthlyAvailability): DayAvailability[] {
  const dayAvailabilityMap = new Map<string, boolean>();
  
  // Extract dates from tenant time slots and check if any are available
  monthlyData.tenant.timeSlots.forEach(slot => {
    const date = slot.datetime.split('T')[0];
    if (!dayAvailabilityMap.has(date)) {
      dayAvailabilityMap.set(date, false);
    }
    if (slot.isAvailable) {
      dayAvailabilityMap.set(date, true);
    }
  });
  
  // Convert to DayAvailability array
  return Array.from(dayAvailabilityMap.entries()).map(([date, hasAvailability]) => ({
    date,
    hasAvailability
  }));
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
      const result = await availabilityApi.getMonthlyAvailability(tenantId, year, month - 1);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch availability data');
      }

      // Convert MonthlyAvailability to DayAvailability[]
      const convertedData = result.data ? convertToDateAvailability(result.data) : [];
      setAvailabilityData(convertedData);
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
