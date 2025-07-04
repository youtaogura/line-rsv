import {
  adminBusinessHoursApi,
  type AdminBusinessHour,
  type CreateBusinessHourData,
} from '@/lib/api';
import { useCallback, useState } from 'react';

export const useAdminBusinessHours = () => {
  const [businessHours, setBusinessHours] = useState<AdminBusinessHour[]>([]);

  const fetchBusinessHours = useCallback(async () => {
    try {
      const response = await adminBusinessHoursApi.getBusinessHours();

      if (response.success) {
        setBusinessHours(response.data || []);
      } else {
        console.error('Error fetching business hours:', response.error);
      }
    } catch (error) {
      console.error('Fetch business hours error:', error);
    }
  }, []);

  const createBusinessHour = async (newBusinessHour: CreateBusinessHourData) => {
    try {
      const response = await adminBusinessHoursApi.createBusinessHour(newBusinessHour);

      if (response.success && response.data) {
        setBusinessHours([...businessHours, response.data]);
        alert('営業時間を追加しました');
        return true;
      } else {
        alert(response.error || '営業時間の追加に失敗しました');
        return false;
      }
    } catch (error) {
      console.error('Create business hour error:', error);
      alert('営業時間の追加に失敗しました');
      return false;
    }
  };

  const deleteBusinessHour = async (id: string) => {
    if (!confirm('この営業時間を削除しますか？')) return;

    try {
      const response = await adminBusinessHoursApi.deleteBusinessHour(id);

      if (response.success) {
        setBusinessHours(businessHours.filter((bh) => bh.id !== id));
        alert('営業時間を削除しました');
      } else {
        alert(response.error || '営業時間の削除に失敗しました');
      }
    } catch (error) {
      console.error('Delete business hour error:', error);
      alert('営業時間の削除に失敗しました');
    }
  };

  return {
    businessHours,
    fetchBusinessHours,
    createBusinessHour,
    deleteBusinessHour,
  };
};