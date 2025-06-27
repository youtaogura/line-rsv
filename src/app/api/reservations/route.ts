import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireValidTenant, TenantValidationError } from '@/lib/tenant-validation'

export async function GET(request: NextRequest) {
  try {
    let tenant
    try {
      tenant = await requireValidTenant(request)
    } catch (error) {
      if (error instanceof TenantValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      throw error
    }

    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ 
        error: 'user_id parameter is required' 
      }, { status: 400 })
    }

    const now = new Date().toISOString()
    
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('id, user_id, name, datetime, note, member_type, created_at')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user_id)
      .gt('datetime', now)
      .order('datetime', { ascending: true })

    if (error) {
      console.error('Reservation fetch error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch reservations' 
      }, { status: 500 })
    }

    return NextResponse.json(reservations)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // テナント検証
    let tenant
    try {
      tenant = await requireValidTenant(request)
    } catch (error) {
      if (error instanceof TenantValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      throw error
    }

    const body = await request.json()
    const { user_id, name, datetime, note, member_type, phone } = body

    // 必須フィールドのバリデーション
    if (!user_id || !name || !datetime || !member_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: user_id, name, datetime, member_type' 
      }, { status: 400 })
    }

    // 予約の重複チェック（テナント内で）
    const { data: existingReservation } = await supabase
      .from('reservations')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user_id)
      .eq('datetime', datetime)
      .single()

    if (existingReservation) {
      return NextResponse.json({ 
        error: 'You already have a reservation at this time' 
      }, { status: 409 })
    }

    // 予約データを挿入
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert({
        tenant_id: tenant.id,
        user_id,
        name,
        datetime,
        note,
        member_type
      })
      .select()
      .single()

    if (reservationError) {
      console.error('Reservation error:', reservationError)
      return NextResponse.json({ 
        error: 'Failed to create reservation' 
      }, { status: 500 })
    }

    // available_slotsテーブルを更新
    const { error: slotError } = await supabase
      .from('available_slots')
      .upsert({ 
        tenant_id: tenant.id,
        datetime,
        is_booked: true 
      })

    if (slotError) {
      console.error('Slot update error:', slotError)
    }

    // ゲストユーザーの場合、usersテーブルに追加
    if (member_type === 'guest') {
      const { data: existingUser } = await supabase
        .from('users')
        .select('user_id')
        .eq('tenant_id', tenant.id)
        .eq('user_id', user_id)
        .single()

      if (!existingUser) {
        const { error: userError } = await supabase
          .from('users')
          .insert({
            tenant_id: tenant.id,
            user_id,
            name,
            phone,
            member_type: 'guest'
          })
        
        if (userError) {
          console.error('User creation error:', userError)
        }
      }
    }

    return NextResponse.json(reservation, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}