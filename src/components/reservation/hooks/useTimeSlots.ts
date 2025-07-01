import { useState, useEffect, useCallback } from 'react';
import { TimeSlot } from '../types';
import { timeSlotsApi } from '@/lib/api';

interface UseTimeSlotsReturn {
  availableSlots: TimeSlot[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTimeSlots(
  selectedDate: Date | null,
  tenantId: string | null,
  selectedStaffId?: string
): UseTimeSlotsReturn {
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeSlots = useCallback(async () => {
    if (!selectedDate || !tenantId) {
      setAvailableSlots([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await timeSlotsApi.getAvailableSlots(selectedDate, tenantId, selectedStaffId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch time slots');
      }

      setAvailableSlots(result.data || []);
    } catch (err) {
      console.error('Error fetching time slots:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, tenantId, selectedStaffId]);

  const refetch = useCallback(() => {
    fetchTimeSlots();
  }, [fetchTimeSlots]);

  useEffect(() => {
    fetchTimeSlots();
  }, [fetchTimeSlots]);

  return {
    availableSlots,
    loading,
    error,
    refetch,
  };
}
