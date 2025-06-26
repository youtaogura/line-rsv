import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { addMinutes, isBefore, startOfMonth, endOfMonth, addDays, format } from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'
import { requireValidTenant, TenantValidationError } from '@/lib/tenant-validation'

interface DayAvailability {
  date: string
  hasAvailability: boolean
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    
    if (!year || !month) {
      return NextResponse.json({ error: 'Year and month parameters are required' }, { status: 400 })
    }

    const yearNum = parseInt(year)
    const monthNum = parseInt(month) - 1 // JavaScript months are 0-indexed

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 0 || monthNum > 11) {
      return NextResponse.json({ error: 'Invalid year or month' }, { status: 400 })
    }

    // 指定月の開始日と終了日を取得
    const monthStart = startOfMonth(new Date(yearNum, monthNum))
    const monthEnd = endOfMonth(new Date(yearNum, monthNum))

    // その月のすべての営業時間を取得
    const { data: businessHours, error: businessError } = await supabase
      .from('business_hours')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)

    if (businessError) {
      console.error('Error fetching business hours:', businessError)
      return NextResponse.json({ error: 'Failed to fetch business hours' }, { status: 500 })
    }

    // 営業時間を曜日別にマップ
    const businessHoursByDay = new Map<number, Array<{
      day_of_week: number;
      start_time: string;
      end_time: string;
      is_active: boolean;
    }>>()
    businessHours?.forEach(bh => {
      if (!businessHoursByDay.has(bh.day_of_week)) {
        businessHoursByDay.set(bh.day_of_week, [])
      }
      businessHoursByDay.get(bh.day_of_week)?.push(bh)
    })

    // 月内のすべての予約を一括取得
    const monthStartISO = monthStart.toISOString()
    const monthEndISO = monthEnd.toISOString()

    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('datetime')
      .eq('tenant_id', tenant.id)
      .gte('datetime', monthStartISO)
      .lte('datetime', monthEndISO)

    if (reservationsError) {
      console.error('Error fetching reservations:', reservationsError)
      return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 })
    }

    // 予約済みスロットも取得
    const { data: bookedSlots, error: slotsError } = await supabase
      .from('available_slots')
      .select('datetime')
      .eq('tenant_id', tenant.id)
      .eq('is_booked', true)
      .gte('datetime', monthStartISO)
      .lte('datetime', monthEndISO)

    if (slotsError) {
      console.error('Error fetching booked slots:', slotsError)
      return NextResponse.json({ error: 'Failed to fetch booked slots' }, { status: 500 })
    }

    // 予約済み時間のセット
    const bookedTimes = new Set([
      ...(reservations?.map(r => r.datetime) || []),
      ...(bookedSlots?.map(s => s.datetime) || [])
    ])

    const japanTimeZone = 'Asia/Tokyo'
    const dayAvailabilities: DayAvailability[] = []

    // 月の各日について空き状況をチェック
    let currentDay = monthStart
    while (currentDay <= monthEnd) {
      const dayOfWeek = currentDay.getDay()
      const dateStr = format(currentDay, 'yyyy-MM-dd')
      
      let hasAvailability = false

      // その曜日に営業時間があるかチェック
      const dayBusinessHours = businessHoursByDay.get(dayOfWeek)
      
      if (dayBusinessHours && dayBusinessHours.length > 0) {
        // その日の営業時間内のスロットを生成
        for (const businessHour of dayBusinessHours) {
          const startTimeStr = `${dateStr} ${businessHour.start_time}`
          const endTimeStr = `${dateStr} ${businessHour.end_time}`
          
          const startTime = fromZonedTime(startTimeStr, japanTimeZone)
          const endTime = fromZonedTime(endTimeStr, japanTimeZone)
          
          let current = startTime
          while (isBefore(current, endTime)) {
            const slotISO = current.toISOString()
            
            // このスロットが予約済みでない場合、空きありとする
            if (!bookedTimes.has(slotISO)) {
              hasAvailability = true
              break
            }
            
            current = addMinutes(current, 30)
          }
          
          if (hasAvailability) break
        }
      }

      dayAvailabilities.push({
        date: dateStr,
        hasAvailability
      })

      currentDay = addDays(currentDay, 1)
    }

    return NextResponse.json(dayAvailabilities)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}