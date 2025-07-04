import {
  adminStaffMembersApi,
  type AdminStaffMember,
  type AdminStaffMemberBusinessHour,
  type CreateStaffBusinessHourData,
} from '@/lib/api';
import { useCallback, useState } from 'react';

export const useAdminStaffMembers = () => {
  const [staffMembers, setStaffMembers] = useState<AdminStaffMember[]>([]);
  const [staffBusinessHours, setStaffBusinessHours] = useState<{
    [staffId: string]: AdminStaffMemberBusinessHour[];
  }>({});
  const [loading, setLoading] = useState(true);

  const fetchStaffMembers = useCallback(
    async (options?: { withBusinessHours?: boolean }) => {
      try {
        const response = await adminStaffMembersApi.getStaffMembers();

        if (response.success) {
          setStaffMembers(response.data || []);

          // 営業時間も一緒に取得する場合
          if (options?.withBusinessHours) {
            try {
              const businessHoursResponse = await adminStaffMembersApi.getStaffMemberBusinessHours('all');
              if (businessHoursResponse.success) {
                const allBusinessHoursData = businessHoursResponse.data || [];

                // スタッフIDごとにグループ化
                const businessHoursMap: {
                  [staffId: string]: AdminStaffMemberBusinessHour[];
                } = {};
                allBusinessHoursData.forEach((bh: AdminStaffMemberBusinessHour) => {
                  if (!businessHoursMap[bh.staff_member_id]) {
                    businessHoursMap[bh.staff_member_id] = [];
                  }
                  businessHoursMap[bh.staff_member_id].push(bh);
                });

                setStaffBusinessHours(businessHoursMap);
              }
            } catch (error) {
              console.error('Error fetching staff business hours:', error);
            }
          }
        } else {
          console.error('Error fetching staff members:', response.error);
        }
      } catch (error) {
        console.error('Fetch staff members error:', error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createStaffMember = async (name: string) => {
    try {
      const response = await adminStaffMembersApi.createStaffMember({ name });

      if (response.success && response.data) {
        setStaffMembers([...staffMembers, response.data]);
        alert('スタッフを追加しました');
        return true;
      } else {
        alert(response.error || 'スタッフの追加に失敗しました');
        return false;
      }
    } catch (error) {
      console.error('Create staff member error:', error);
      alert('スタッフの追加に失敗しました');
      return false;
    }
  };

  const updateStaffMember = async (id: string, name: string) => {
    try {
      const response = await adminStaffMembersApi.updateStaffMember(id, { name });

      if (response.success && response.data) {
        setStaffMembers(staffMembers.map((sm) => (sm.id === id ? response.data! : sm)));
        alert('スタッフ情報を更新しました');
        return true;
      } else {
        alert(response.error || 'スタッフ情報の更新に失敗しました');
        return false;
      }
    } catch (error) {
      console.error('Update staff member error:', error);
      alert('スタッフ情報の更新に失敗しました');
      return false;
    }
  };

  const deleteStaffMember = async (id: string) => {
    if (!confirm('このスタッフを削除しますか？')) return;

    try {
      const response = await adminStaffMembersApi.deleteStaffMember(id);

      if (response.success) {
        setStaffMembers(staffMembers.filter((sm) => sm.id !== id));
        alert('スタッフを削除しました');
      } else {
        alert(response.error || 'スタッフの削除に失敗しました');
      }
    } catch (error) {
      console.error('Delete staff member error:', error);
      alert('スタッフの削除に失敗しました');
    }
  };

  return {
    staffMembers,
    staffBusinessHours,
    loading,
    fetchStaffMembers,
    createStaffMember,
    updateStaffMember,
    deleteStaffMember,
  };
};

export const useAdminStaffMemberBusinessHours = () => {
  const [businessHours, setBusinessHours] = useState<AdminStaffMemberBusinessHour[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStaffMemberBusinessHours = useCallback(
    async (staffMemberId: string) => {
      try {
        const response = await adminStaffMembersApi.getStaffMemberBusinessHours(staffMemberId);

        if (response.success) {
          setBusinessHours(response.data || []);
        } else {
          console.error(
            'Error fetching staff member business hours:',
            response.error
          );
        }
      } catch (error) {
        console.error('Fetch staff member business hours error:', error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createStaffMemberBusinessHour = async (businessHour: CreateStaffBusinessHourData) => {
    try {
      const response = await adminStaffMembersApi.createStaffMemberBusinessHour(businessHour);

      if (response.success && response.data) {
        setBusinessHours([...businessHours, response.data]);
        alert('営業時間を追加しました');
        return true;
      } else {
        alert(response.error || '営業時間の追加に失敗しました');
        return false;
      }
    } catch (error) {
      console.error('Create staff member business hour error:', error);
      alert('営業時間の追加に失敗しました');
      return false;
    }
  };

  const deleteStaffMemberBusinessHour = async (id: string) => {
    if (!confirm('この営業時間を削除しますか？')) return;

    try {
      const response = await adminStaffMembersApi.deleteStaffMemberBusinessHour(id);

      if (response.success) {
        setBusinessHours(businessHours.filter((bh) => bh.id !== id));
        alert('営業時間を削除しました');
      } else {
        alert(response.error || '営業時間の削除に失敗しました');
      }
    } catch (error) {
      console.error('Delete staff member business hour error:', error);
      alert('営業時間の削除に失敗しました');
    }
  };

  return {
    businessHours,
    loading,
    fetchStaffMemberBusinessHours,
    createStaffMemberBusinessHour,
    deleteStaffMemberBusinessHour,
  };
};