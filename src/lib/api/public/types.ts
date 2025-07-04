export interface CreateReservationData {
  user_id: string;
  name: string;
  datetime: string;
  note?: string;
  member_type: 'regular' | 'guest';
  phone?: string;
  reservation_menu_id?: string;
  staff_member_id?: string;
}