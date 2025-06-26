import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireValidTenant, TenantValidationError } from '@/lib/tenant-validation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
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

    const { user_id } = await params

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user_id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      console.error('Error fetching user:', error)
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
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

    const { user_id } = await params
    const body = await request.json()
    const { name, phone, member_type } = body

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (member_type && !['regular', 'guest'].includes(member_type)) {
      return NextResponse.json({ error: 'Invalid member_type. Must be "regular" or "guest"' }, { status: 400 })
    }

    // Check if user exists
    const { error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user_id)
      .single()

    if (fetchError && fetchError.code === 'PGRST116') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    } else if (fetchError) {
      console.error('Error fetching user:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
    }

    // Update user
    const updateData: { name?: string; phone?: string; member_type?: 'regular' | 'guest' } = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (member_type !== undefined) updateData.member_type = member_type

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('tenant_id', tenant.id)
      .eq('user_id', user_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}