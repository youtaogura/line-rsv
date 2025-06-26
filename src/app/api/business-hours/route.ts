import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('business_hours')
      .select('*')
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching business hours:', error)
      return NextResponse.json({ error: 'Failed to fetch business hours' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { day_of_week, start_time, end_time } = body

    if (typeof day_of_week !== 'number' || day_of_week < 0 || day_of_week > 6) {
      return NextResponse.json({ error: 'Invalid day_of_week. Must be 0-6.' }, { status: 400 })
    }

    if (!start_time || !end_time) {
      return NextResponse.json({ error: 'start_time and end_time are required' }, { status: 400 })
    }

    const startHour = parseInt(start_time.split(':')[0])
    const endHour = parseInt(end_time.split(':')[0])
    
    if (startHour < 9 || endHour > 18 || startHour >= endHour) {
      return NextResponse.json({ error: 'Invalid time range. Business hours must be between 09:00-18:00' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('business_hours')
      .insert([{
        day_of_week,
        start_time,
        end_time,
        is_active: true
      }])
      .select()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'This time slot already exists' }, { status: 409 })
      }
      console.error('Error creating business hour:', error)
      return NextResponse.json({ error: 'Failed to create business hour' }, { status: 500 })
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('business_hours')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Error deactivating business hour:', error)
      return NextResponse.json({ error: 'Failed to delete business hour' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Business hour deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}