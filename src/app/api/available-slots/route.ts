import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { parseISO, addMinutes, isBefore } from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
    }

    const targetDate = parseISO(date)
    const dayOfWeek = targetDate.getDay()

    const { data: businessHours, error: businessError } = await supabase
      .from('business_hours')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)

    if (businessError) {
      console.error('Error fetching business hours:', businessError)
      return NextResponse.json({ error: 'Failed to fetch business hours' }, { status: 500 })
    }

    if (!businessHours || businessHours.length === 0) {
      return NextResponse.json([])
    }

    const slots: string[] = []
    const japanTimeZone = 'Asia/Tokyo'

    console.log('Business hours:', businessHours)
    
    for (const businessHour of businessHours) {
      // 日本時間で日付と時刻を組み合わせ
      const startTimeStr = `${date} ${businessHour.start_time}`
      const endTimeStr = `${date} ${businessHour.end_time}`
      
      // 日本時間からUTCに変換
      const startTime = fromZonedTime(startTimeStr, japanTimeZone)
      const endTime = fromZonedTime(endTimeStr, japanTimeZone)
      
      let current = startTime
      console.log('Start time (UTC):', startTime.toISOString())
      console.log('End time (UTC):', endTime.toISOString())
      
      while (isBefore(current, endTime)) {
        slots.push(current.toISOString())
        current = addMinutes(current, 30)
      }
    }

    // 既存の予約済みスロットを取得
    const { data: bookedSlots, error: slotsError } = await supabase
      .from('available_slots')
      .select('datetime')
      .eq('is_booked', true)
      .in('datetime', slots)

    if (slotsError) {
      console.error('Error fetching booked slots:', slotsError)
      return NextResponse.json({ error: 'Failed to fetch booked slots' }, { status: 500 })
    }

    // 予約済み時間を取得
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('datetime')
      .in('datetime', slots)

    if (reservationsError) {
      console.error('Error fetching reservations:', reservationsError)
      return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 })
    }

    // 予約済みの時間を正規化してセットに変換
    const normalizeDateTime = (dateTimeStr: string) => {
      return parseISO(dateTimeStr).toISOString()
    }

    const bookedTimes = new Set([
      ...(bookedSlots?.map(slot => normalizeDateTime(slot.datetime)) || []),
      ...(reservations?.map(reservation => normalizeDateTime(reservation.datetime)) || [])
    ])

    console.log('All slots:', slots)
    console.log('Booked times:', bookedTimes)

    // 利用可能な時間のみを返す（時刻を正規化して比較）
    const availableSlots = slots
      .filter(slot => !bookedTimes.has(normalizeDateTime(slot)))
      .map(slot => ({
        datetime: slot,
        is_booked: false
      }))

    return NextResponse.json(availableSlots)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}