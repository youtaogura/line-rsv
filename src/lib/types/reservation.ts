export interface ReservationWithStaff {
  id: string;
  tenant_id: string;
  name: string;
  datetime: string;
  note?: string;
  admin_note?: string;
  member_type: 'regular' | 'guest';
  duration_minutes?: number;
  is_created_by_user: boolean;
  staff_members?: {
    id: string;
    name: string;
  };
  users: {
    user_id: string;
    name: string;
  };
}
