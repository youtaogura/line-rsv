import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Tenant = {
  id: string
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type User = {
  user_id: string
  tenant_id: string
  name: string
  phone?: string
  member_type: 'regular' | 'guest'
  created_at: string
}

export type Reservation = {
  id: string
  tenant_id: string
  user_id: string
  name: string
  datetime: string
  note?: string
  admin_note?: string
  member_type: 'regular' | 'guest'
  created_at: string
}

export type AvailableSlot = {
  tenant_id: string
  datetime: string
  is_booked: boolean
}

export type BusinessHour = {
  id: string
  tenant_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
  created_at: string
}

export type Admin = {
  id: string
  tenant_id: string
  username: string
  password_hash: string
  name: string
  created_at: string
  updated_at: string
}