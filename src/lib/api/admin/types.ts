export interface CreateAdminReservationData {
  user_id: string;
  name: string;
  datetime: string;
  note?: string | null;
  member_type: string;
  phone?: string | null;
  reservation_menu_id?: string | null;
  staff_member_id?: string | null;
  admin_note?: string | null;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}