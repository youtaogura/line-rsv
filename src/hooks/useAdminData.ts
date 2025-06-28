import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Reservation, BusinessHour, User, StaffMember, StaffMemberBusinessHour } from "@/lib/supabase";
import { buildApiUrl } from "@/lib/tenant-helpers";
import type { AdminSession } from "@/lib/admin-types";

export const useAdminSession = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/admin/login");
      return;
    }
  }, [session, status, router]);

  return {
    session: session as unknown as AdminSession,
    status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
};

export const useReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchReservations = useCallback(async (tenantId: string, staffMemberId?: string, startDate?: string, endDate?: string) => {
    try {
      if (!tenantId) {
        console.error("No tenant ID found in session");
        return;
      }

      // 管理者画面でのフィルタリング機能を使用
      const queryParams = new URLSearchParams();
      if (staffMemberId && staffMemberId !== "all") {
        queryParams.set("staff_member_id", staffMemberId);
      }
      if (startDate) {
        queryParams.set("start_date", startDate);
      }
      if (endDate) {
        queryParams.set("end_date", endDate);
      }

      const response = await fetch(
        buildApiUrl(`/api/admin/reservations?${queryParams.toString()}`, tenantId),
      );

      if (response.ok) {
        const data = await response.json();
        setReservations(data || []);
      } else {
        console.error("Error fetching reservations:", response.statusText);
        // フォールバック: 直接Supabaseから取得
        const { data, error } = await supabase
          .from("reservations")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("datetime", { ascending: true });

        if (error) {
          console.error("Error fetching reservations:", error);
        } else {
          setReservations(data || []);
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteReservation = async (tenantId: string, reservationId: string) => {
    if (!confirm("この予約を削除しますか？")) return;

    try {
      if (!tenantId) {
        alert("セッション情報が正しくありません");
        return;
      }

      const response = await fetch(
        buildApiUrl(`/api/reservations?id=${reservationId}`, tenantId),
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        setReservations(reservations.filter((r) => r.id !== reservationId));
        alert("予約を削除しました");
      } else {
        const data = await response.json();
        alert(data.error || "予約の削除に失敗しました");
      }
    } catch (error) {
      console.error("Delete reservation error:", error);
      alert("予約の削除に失敗しました");
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
      const tenantId = session?.user?.tenant_id;
      if (!tenantId) {
        console.error("No tenant ID found in session");
        return;
      }

      const response = await fetch(
        buildApiUrl("/api/business-hours", tenantId),
      );
      const data = await response.json();

      if (response.ok) {
        setBusinessHours(data);
      } else {
        console.error("Error fetching business hours:", data.error);
      }
    } catch (error) {
      console.error("Fetch business hours error:", error);
    }
  }, [session]);

  const createBusinessHour = async (newBusinessHour: {
    day_of_week: number;
    start_time: string;
    end_time: string;
  }) => {
    try {
      const tenantId = session?.user?.tenant_id;
      if (!tenantId) {
        alert("セッション情報が正しくありません");
        return false;
      }

      const response = await fetch(
        buildApiUrl("/api/business-hours", tenantId),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newBusinessHour),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setBusinessHours([...businessHours, data]);
        alert("営業時間を追加しました");
        return true;
      } else {
        alert(data.error || "営業時間の追加に失敗しました");
        return false;
      }
    } catch (error) {
      console.error("Create business hour error:", error);
      alert("営業時間の追加に失敗しました");
      return false;
    }
  };

  const deleteBusinessHour = async (id: string) => {
    if (!confirm("この営業時間を削除しますか？")) return;

    try {
      const tenantId = session?.user?.tenant_id;
      if (!tenantId) {
        alert("セッション情報が正しくありません");
        return;
      }

      const response = await fetch(
        buildApiUrl(`/api/business-hours?id=${id}`, tenantId),
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        setBusinessHours(businessHours.filter((bh) => bh.id !== id));
        alert("営業時間を削除しました");
      } else {
        const data = await response.json();
        alert(data.error || "営業時間の削除に失敗しました");
      }
    } catch (error) {
      console.error("Delete business hour error:", error);
      alert("営業時間の削除に失敗しました");
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
      const tenantId = session?.user?.tenant_id;
      if (!tenantId) {
        console.error("No tenant ID found in session");
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching users:", error);
      } else {
        setUsers(data || []);
      }
    } catch (error) {
      console.error("Fetch users error:", error);
    }
  }, [session]);

  const updateUser = async (
    userId: string,
    updateData: {
      name: string;
      phone: string;
      member_type: "regular" | "guest";
    },
  ) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(
          users.map((user) => (user.user_id === userId ? updatedUser : user)),
        );
        alert("ユーザー情報を更新しました");
        return true;
      } else {
        const errorData = await response.json();
        alert(errorData.error || "ユーザー情報の更新に失敗しました");
        return false;
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("ユーザー情報の更新に失敗しました");
      return false;
    }
  };

  const mergeUser = async (
    sourceUserId: string,
    targetUserId: string,
  ) => {
    try {
      const tenantId = session?.user?.tenant_id;
      if (!tenantId) {
        alert("セッション情報が正しくありません");
        return false;
      }

      const response = await fetch(
        buildApiUrl(`/api/users/${sourceUserId}/merge`, tenantId),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ target_user_id: targetUserId }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        
        // ユーザーリストを更新（ソースユーザーを削除、ターゲットユーザーを更新）
        setUsers(prevUsers => 
          prevUsers
            .filter(user => user.user_id !== sourceUserId)
            .map(user => 
              user.user_id === targetUserId ? result.updated_user : user
            )
        );
        
        alert(`ユーザーの統合が完了しました。${result.merged_reservations_count}件の予約が移行されました。`);
        return true;
      } else {
        const errorData = await response.json();
        alert(errorData.error || "ユーザーの統合に失敗しました");
        return false;
      }
    } catch (error) {
      console.error("Error merging user:", error);
      alert("ユーザーの統合に失敗しました");
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
  const [loading, setLoading] = useState(true);
  const { session } = useAdminSession();

  const fetchStaffMembers = useCallback(async () => {
    try {
      const tenantId = session?.user?.tenant_id;
      if (!tenantId) {
        console.error("No tenant ID found in session");
        return;
      }

      const response = await fetch(
        buildApiUrl("/api/staff-members", tenantId),
      );
      const data = await response.json();

      if (response.ok) {
        setStaffMembers(data);
      } else {
        console.error("Error fetching staff members:", data.error);
      }
    } catch (error) {
      console.error("Fetch staff members error:", error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  const createStaffMember = async (name: string) => {
    try {
      const tenantId = session?.user?.tenant_id;
      if (!tenantId) {
        alert("セッション情報が正しくありません");
        return false;
      }

      const response = await fetch(
        buildApiUrl("/api/staff-members", tenantId),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setStaffMembers([...staffMembers, data]);
        alert("スタッフを追加しました");
        return true;
      } else {
        alert(data.error || "スタッフの追加に失敗しました");
        return false;
      }
    } catch (error) {
      console.error("Create staff member error:", error);
      alert("スタッフの追加に失敗しました");
      return false;
    }
  };

  const updateStaffMember = async (id: string, name: string) => {
    try {
      const tenantId = session?.user?.tenant_id;
      if (!tenantId) {
        alert("セッション情報が正しくありません");
        return false;
      }

      const response = await fetch(
        buildApiUrl(`/api/staff-members?id=${id}`, tenantId),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setStaffMembers(staffMembers.map(sm => sm.id === id ? data : sm));
        alert("スタッフ情報を更新しました");
        return true;
      } else {
        alert(data.error || "スタッフ情報の更新に失敗しました");
        return false;
      }
    } catch (error) {
      console.error("Update staff member error:", error);
      alert("スタッフ情報の更新に失敗しました");
      return false;
    }
  };

  const deleteStaffMember = async (id: string) => {
    if (!confirm("このスタッフを削除しますか？")) return;

    try {
      const tenantId = session?.user?.tenant_id;
      if (!tenantId) {
        alert("セッション情報が正しくありません");
        return;
      }

      const response = await fetch(
        buildApiUrl(`/api/staff-members?id=${id}`, tenantId),
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        setStaffMembers(staffMembers.filter(sm => sm.id !== id));
        alert("スタッフを削除しました");
      } else {
        const data = await response.json();
        alert(data.error || "スタッフの削除に失敗しました");
      }
    } catch (error) {
      console.error("Delete staff member error:", error);
      alert("スタッフの削除に失敗しました");
    }
  };

  return {
    staffMembers,
    loading,
    fetchStaffMembers,
    createStaffMember,
    updateStaffMember,
    deleteStaffMember,
  };
};

export const useStaffMemberBusinessHours = () => {
  const [businessHours, setBusinessHours] = useState<StaffMemberBusinessHour[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAdminSession();

  const fetchStaffMemberBusinessHours = useCallback(async (staffMemberId: string) => {
    try {
      const tenantId = session?.user?.tenant_id;
      if (!tenantId) {
        console.error("No tenant ID found in session");
        return;
      }

      const response = await fetch(
        buildApiUrl(`/api/staff-member-business-hours?staff_member_id=${staffMemberId}`, tenantId),
      );
      const data = await response.json();

      if (response.ok) {
        setBusinessHours(data);
      } else {
        console.error("Error fetching staff member business hours:", data.error);
      }
    } catch (error) {
      console.error("Fetch staff member business hours error:", error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  const createStaffMemberBusinessHour = async (businessHour: {
    staff_member_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }) => {
    try {
      const tenantId = session?.user?.tenant_id;
      if (!tenantId) {
        alert("セッション情報が正しくありません");
        return false;
      }

      const response = await fetch(
        buildApiUrl("/api/staff-member-business-hours", tenantId),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(businessHour),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setBusinessHours([...businessHours, data]);
        alert("営業時間を追加しました");
        return true;
      } else {
        alert(data.error || "営業時間の追加に失敗しました");
        return false;
      }
    } catch (error) {
      console.error("Create staff member business hour error:", error);
      alert("営業時間の追加に失敗しました");
      return false;
    }
  };

  const deleteStaffMemberBusinessHour = async (id: string) => {
    if (!confirm("この営業時間を削除しますか？")) return;

    try {
      const tenantId = session?.user?.tenant_id;
      if (!tenantId) {
        alert("セッション情報が正しくありません");
        return;
      }

      const response = await fetch(
        buildApiUrl(`/api/staff-member-business-hours?id=${id}`, tenantId),
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        setBusinessHours(businessHours.filter(bh => bh.id !== id));
        alert("営業時間を削除しました");
      } else {
        const data = await response.json();
        alert(data.error || "営業時間の削除に失敗しました");
      }
    } catch (error) {
      console.error("Delete staff member business hour error:", error);
      alert("営業時間の削除に失敗しました");
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
    null,
  );
  const { session } = useAdminSession();

  const fetchTenant = useCallback(async () => {
    try {
      const tenantId = session?.user?.tenant_id;
      if (!tenantId) {
        console.error("No tenant ID found in session");
        return;
      }

      const response = await fetch(
        buildApiUrl(`/api/tenants/${tenantId}`, tenantId),
      );
      if (response.ok) {
        const tenantData = await response.json();
        setTenant(tenantData);
      } else {
        console.error("Error fetching tenant data");
      }
    } catch (error) {
      console.error("Fetch tenant error:", error);
    }
  }, [session]);

  return {
    tenant,
    fetchTenant,
  };
};

export const useRecentReservations = () => {
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAdminSession();

  const fetchRecentReservations = useCallback(async (limit: number = 5) => {
    try {
      const tenantId = session?.user?.tenant_id;
      if (!tenantId) {
        console.error("No tenant ID found in session");
        return;
      }

      setLoading(true);
      const response = await fetch(
        buildApiUrl(`/api/admin/recent-reservations?limit=${limit}`, tenantId),
      );

      if (response.ok) {
        const data = await response.json();
        setRecentReservations(data || []);
      } else {
        console.error("Error fetching recent reservations:", response.statusText);
        setRecentReservations([]);
      }
    } catch (error) {
      console.error("Fetch recent reservations error:", error);
      setRecentReservations([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  return {
    recentReservations,
    loading,
    fetchRecentReservations,
  };
};

export const useUnassignedReservations = () => {
  const [unassignedReservations, setUnassignedReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAdminSession();

  const fetchUnassignedReservations = useCallback(async () => {
    try {
      const tenantId = session?.user?.tenant_id;
      if (!tenantId) {
        console.error("No tenant ID found in session");
        return;
      }

      setLoading(true);
      const response = await fetch(
        buildApiUrl("/api/admin/reservations?staff_member_id=unassigned", tenantId),
      );

      if (response.ok) {
        const data = await response.json();
        setUnassignedReservations(data || []);
      } else {
        console.error("Error fetching unassigned reservations:", response.statusText);
        setUnassignedReservations([]);
      }
    } catch (error) {
      console.error("Fetch unassigned reservations error:", error);
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
