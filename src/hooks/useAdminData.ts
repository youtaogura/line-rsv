import type { AdminSession } from '@/lib/admin-types';
import { buildAdminApiUrl } from '@/lib/api';
import type {
  BusinessHour,
  Reservation,
  StaffMember,
  StaffMemberBusinessHour,
  User,
} from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export const useAdminSession = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }
  }, [session, status, router]);

  return {
    session: session as unknown as AdminSession,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
};

export const useReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAdminSession();

  const fetchReservations = useCallback(
    async (
      staffMemberId?: string,
      startDate?: string,
      endDate?: string
    ) => {
      try {

        // 管理者画面でのフィルタリング機能を使用
        const queryParams = new URLSearchParams();
        if (staffMemberId && staffMemberId !== 'all') {
          queryParams.set('staff_member_id', staffMemberId);
        }
        if (startDate) {
          queryParams.set('start_date', startDate);
        }
        if (endDate) {
          queryParams.set('end_date', endDate);
        }

        const response = await fetch(
          buildAdminApiUrl(`/api/admin/reservations?${queryParams.toString()}`)
        );

        if (response.ok) {
          const data = await response.json();
          setReservations(data || []);
        } else {
          console.error('Error fetching reservations:', response.statusText);
          // フォールバック: 直接Supabaseから取得
          const { data, error } = await supabase
            .from('reservations')
            .select('*')
            .eq('tenant_id', session?.user?.tenant_id)
            .order('datetime', { ascending: true });

          if (error) {
            console.error('Error fetching reservations:', error);
          } else {
            setReservations(data || []);
          }
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  const deleteReservation = async (reservationId: string) => {
    if (!confirm('この予約を削除しますか？')) return;

    try {

      const response = await fetch(
        buildAdminApiUrl(`/api/admin/reservations?id=${reservationId}`),
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setReservations(reservations.filter((r) => r.id !== reservationId));
        alert('予約を削除しました');
      } else {
        const data = await response.json();
        alert(data.error || '予約の削除に失敗しました');
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

export const useBusinessHours = () => {
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const { session } = useAdminSession();

  const fetchBusinessHours = useCallback(async () => {
    try {

      const response = await fetch(
        buildAdminApiUrl('/api/admin/business-hours')
      );
      const data = await response.json();

      if (response.ok) {
        setBusinessHours(data);
      } else {
        console.error('Error fetching business hours:', data.error);
      }
    } catch (error) {
      console.error('Fetch business hours error:', error);
    }
  }, [session]);

  const createBusinessHour = async (newBusinessHour: {
    day_of_week: number;
    start_time: string;
    end_time: string;
  }) => {
    try {

      const response = await fetch(
        buildAdminApiUrl('/api/admin/business-hours'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newBusinessHour),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setBusinessHours([...businessHours, data]);
        alert('営業時間を追加しました');
        return true;
      } else {
        alert(data.error || '営業時間の追加に失敗しました');
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

      const response = await fetch(
        buildAdminApiUrl(`/api/admin/business-hours?id=${id}`),
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setBusinessHours(businessHours.filter((bh) => bh.id !== id));
        alert('営業時間を削除しました');
      } else {
        const data = await response.json();
        alert(data.error || '営業時間の削除に失敗しました');
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

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const { session } = useAdminSession();

  const fetchUsers = useCallback(async () => {
    try {

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('tenant_id', session?.user?.tenant_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
      } else {
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Fetch users error:', error);
    }
  }, [session]);

  const updateUser = async (
    userId: string,
    updateData: {
      name: string;
      phone: string;
      member_type: 'regular' | 'guest';
    }
  ) => {
    try {

      const response = await fetch(
        buildAdminApiUrl(`/api/admin/users/${userId}`),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(
          users.map((user) => (user.user_id === userId ? updatedUser : user))
        );
        alert('ユーザー情報を更新しました');
        return true;
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'ユーザー情報の更新に失敗しました');
        return false;
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('ユーザー情報の更新に失敗しました');
      return false;
    }
  };

  const mergeUser = async (sourceUserId: string, targetUserId: string) => {
    try {

      const response = await fetch(
        buildAdminApiUrl(`/api/admin/users/${sourceUserId}/merge`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ target_user_id: targetUserId }),
        }
      );

      if (response.ok) {
        const result = await response.json();

        // ユーザーリストを更新（ソースユーザーを削除、ターゲットユーザーを更新）
        setUsers((prevUsers) =>
          prevUsers
            .filter((user) => user.user_id !== sourceUserId)
            .map((user) =>
              user.user_id === targetUserId ? result.updated_user : user
            )
        );

        alert(
          `ユーザーの統合が完了しました。${result.merged_reservations_count}件の予約が移行されました。`
        );
        return true;
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'ユーザーの統合に失敗しました');
        return false;
      }
    } catch (error) {
      console.error('Error merging user:', error);
      alert('ユーザーの統合に失敗しました');
      return false;
    }
  };

  return {
    users,
    fetchUsers,
    updateUser,
    mergeUser,
  };
};

export const useStaffMembers = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [staffBusinessHours, setStaffBusinessHours] = useState<{
    [staffId: string]: StaffMemberBusinessHour[];
  }>({});
  const [loading, setLoading] = useState(true);
  const { session } = useAdminSession();

  const fetchStaffMembers = useCallback(
    async (options?: { withBusinessHours?: boolean }) => {
      try {

        const response = await fetch(
          buildAdminApiUrl('/api/admin/staff-members')
        );
        const data = await response.json();

        if (response.ok) {
          setStaffMembers(data);

          // 営業時間も一緒に取得する場合
          if (options?.withBusinessHours) {
            try {
              const businessHoursResponse = await fetch(
                buildAdminApiUrl(
                  `/api/admin/staff-member-business-hours?staff_member_id=all`
                )
              );
              if (businessHoursResponse.ok) {
                const allBusinessHoursData = await businessHoursResponse.json();

                // スタッフIDごとにグループ化
                const businessHoursMap: {
                  [staffId: string]: StaffMemberBusinessHour[];
                } = {};
                allBusinessHoursData.forEach((bh: StaffMemberBusinessHour) => {
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
          console.error('Error fetching staff members:', data.error);
        }
      } catch (error) {
        console.error('Fetch staff members error:', error);
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  const createStaffMember = async (name: string) => {
    try {

      const response = await fetch(
        buildAdminApiUrl('/api/admin/staff-members'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setStaffMembers([...staffMembers, data]);
        alert('スタッフを追加しました');
        return true;
      } else {
        alert(data.error || 'スタッフの追加に失敗しました');
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

      const response = await fetch(
        buildAdminApiUrl(`/api/admin/staff-members?id=${id}`),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setStaffMembers(staffMembers.map((sm) => (sm.id === id ? data : sm)));
        alert('スタッフ情報を更新しました');
        return true;
      } else {
        alert(data.error || 'スタッフ情報の更新に失敗しました');
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

      const response = await fetch(
        buildAdminApiUrl(`/api/admin/staff-members?id=${id}`),
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setStaffMembers(staffMembers.filter((sm) => sm.id !== id));
        alert('スタッフを削除しました');
      } else {
        const data = await response.json();
        alert(data.error || 'スタッフの削除に失敗しました');
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

export const useStaffMemberBusinessHours = () => {
  const [businessHours, setBusinessHours] = useState<StaffMemberBusinessHour[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const { session } = useAdminSession();

  const fetchStaffMemberBusinessHours = useCallback(
    async (staffMemberId: string) => {
      try {

        const response = await fetch(
          buildAdminApiUrl(
            `/api/admin/staff-member-business-hours?staff_member_id=${staffMemberId}`
          )
        );
        const data = await response.json();

        if (response.ok) {
          setBusinessHours(data);
        } else {
          console.error(
            'Error fetching staff member business hours:',
            data.error
          );
        }
      } catch (error) {
        console.error('Fetch staff member business hours error:', error);
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  const createStaffMemberBusinessHour = async (businessHour: {
    staff_member_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }) => {
    try {

      const response = await fetch(
        buildAdminApiUrl('/api/admin/staff-member-business-hours'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(businessHour),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setBusinessHours([...businessHours, data]);
        alert('営業時間を追加しました');
        return true;
      } else {
        alert(data.error || '営業時間の追加に失敗しました');
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

      const response = await fetch(
        buildAdminApiUrl(
          `/api/admin/staff-member-business-hours?id=${id}`
        ),
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setBusinessHours(businessHours.filter((bh) => bh.id !== id));
        alert('営業時間を削除しました');
      } else {
        const data = await response.json();
        alert(data.error || '営業時間の削除に失敗しました');
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

export const useTenant = () => {
  const [tenant, setTenant] = useState<{ id: string; name: string } | null>(
    null
  );
  const { session } = useAdminSession();

  const fetchTenant = useCallback(async () => {
    try {
      const tenantId = session?.user?.tenant_id;

      const response = await fetch(
        buildAdminApiUrl(`/api/admin/tenants/${tenantId}`)
      );
      if (response.ok) {
        const tenantData = await response.json();
        setTenant(tenantData);
      } else {
        console.error('Error fetching tenant data');
      }
    } catch (error) {
      console.error('Fetch tenant error:', error);
    }
  }, [session]);

  return {
    tenant,
    fetchTenant,
  };
};

export const useRecentReservations = () => {
  const [recentReservations, setRecentReservations] = useState<Reservation[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const { session } = useAdminSession();

  const fetchRecentReservations = useCallback(
    async (limit: number = 5) => {
      try {

        setLoading(true);
        const response = await fetch(
          buildAdminApiUrl(
            `/api/admin/recent-reservations?limit=${limit}`
          )
        );

        if (response.ok) {
          const data = await response.json();
          setRecentReservations(data || []);
        } else {
          console.error(
            'Error fetching recent reservations:',
            response.statusText
          );
          setRecentReservations([]);
        }
      } catch (error) {
        console.error('Fetch recent reservations error:', error);
        setRecentReservations([]);
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  return {
    recentReservations,
    loading,
    fetchRecentReservations,
  };
};

export const useUnassignedReservations = () => {
  const [unassignedReservations, setUnassignedReservations] = useState<
    Reservation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAdminSession();

  const fetchUnassignedReservations = useCallback(async () => {
    try {

      setLoading(true);
      const response = await fetch(
        buildAdminApiUrl(
          '/api/admin/reservations?staff_member_id=unassigned'
        )
      );

      if (response.ok) {
        const data = await response.json();
        setUnassignedReservations(data || []);
      } else {
        console.error(
          'Error fetching unassigned reservations:',
          response.statusText
        );
        setUnassignedReservations([]);
      }
    } catch (error) {
      console.error('Fetch unassigned reservations error:', error);
      setUnassignedReservations([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  return {
    unassignedReservations,
    loading,
    fetchUnassignedReservations,
  };
};
