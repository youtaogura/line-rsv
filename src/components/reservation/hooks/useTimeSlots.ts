import { useState, useEffect, useCallback } from "react";
import { TimeSlot } from "../types";
import { buildApiUrl } from "@/lib/tenant-helpers";
import { format } from "date-fns";

interface UseTimeSlotsReturn {
  availableSlots: TimeSlot[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTimeSlots(
  selectedDate: Date | null,
  tenantId: string | null,
  selectedStaffId?: string,
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
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const queryParams = new URLSearchParams({ date: dateStr });
      if (selectedStaffId) {
        queryParams.set("staff_member_id", selectedStaffId);
      }
      const response = await fetch(
        buildApiUrl(`/api/available-slots?${queryParams.toString()}`, tenantId),
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch time slots");
      }

      const data = await response.json();
      setAvailableSlots(data);
    } catch (err) {
      console.error("Error fetching time slots:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
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
