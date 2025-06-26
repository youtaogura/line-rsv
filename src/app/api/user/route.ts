import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const lineUser = request.cookies.get('line_user')?.value

  if (!lineUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const userData = JSON.parse(lineUser)
    return NextResponse.json(userData)
  } catch (_error) {
    return NextResponse.json({ error: 'Invalid user data' }, { status: 400 })
  }
}