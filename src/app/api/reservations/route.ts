import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, name, datetime, note, member_type, phone } = body

    // 必須フィールドのバリデーション
    if (!user_id || !name || !datetime || !member_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: user_id, name, datetime, member_type' 
      }, { status: 400 })
    }

    // 予約の重複チェック
    const { data: existingReservation } = await supabase
      .from('reservations')
      .select('id')
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
        .eq('user_id', user_id)
        .single()

      if (!existingUser) {
        const { error: userError } = await supabase
          .from('users')
          .insert({
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