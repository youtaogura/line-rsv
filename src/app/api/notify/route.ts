import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { name, datetime, memberType, note } = await request.json()
    
    const token = process.env.LINE_NOTIFY_TOKEN
    if (!token) {
      console.error('LINE_NOTIFY_TOKEN not configured')
      return NextResponse.json({ success: false })
    }

    const date = new Date(datetime)
    const formattedDate = date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'numeric', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const memberTypeText = memberType === 'regular' ? '会員' : 'ゲスト'
    
    let message = `新規予約が入りました！\n\n`
    message += `名前: ${name}（${memberTypeText}）\n`
    message += `日時: ${formattedDate}\n`
    if (note) {
      message += `メモ: ${note}\n`
    }

    const response = await fetch('https://notify-api.line.me/api/notify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        message
      })
    })

    if (response.ok) {
      return NextResponse.json({ success: true })
    } else {
      console.error('LINE Notify error:', await response.text())
      return NextResponse.json({ success: false })
    }
  } catch (error) {
    console.error('Notify API error:', error)
    return NextResponse.json({ success: false })
  }
}