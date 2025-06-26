'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Reservation, BusinessHour } from '@/lib/supabase'
import { format } from 'date-fns'
import { format as formatTz } from 'date-fns-tz'

export default function AdminPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([])
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [activeTab, setActiveTab] = useState<'reservations' | 'business-hours'>('reservations')
  
  const [newBusinessHour, setNewBusinessHour] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '18:00'
  })

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'admin123') {
      setAuthenticated(true)
      fetchData()
    } else {
      alert('パスワードが間違っています')
    }
  }

  const fetchData = async () => {
    await Promise.all([fetchReservations(), fetchBusinessHours()])
  }

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('datetime', { ascending: true })

      if (error) {
        console.error('Error fetching reservations:', error)
      } else {
        setReservations(data || [])
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBusinessHours = async () => {
    try {
      const response = await fetch('/api/business-hours')
      const data = await response.json()
      
      if (response.ok) {
        setBusinessHours(data)
      } else {
        console.error('Error fetching business hours:', data.error)
      }
    } catch (error) {
      console.error('Fetch business hours error:', error)
    }
  }

  const createBusinessHour = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/business-hours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBusinessHour),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setBusinessHours([...businessHours, data])
        setNewBusinessHour({
          day_of_week: 1,
          start_time: '09:00',
          end_time: '18:00'
        })
        alert('営業時間を追加しました')
      } else {
        alert(data.error || '営業時間の追加に失敗しました')
      }
    } catch (error) {
      console.error('Create business hour error:', error)
      alert('営業時間の追加に失敗しました')
    }
  }

  const deleteBusinessHour = async (id: string) => {
    if (!confirm('この営業時間を削除しますか？')) return
    
    try {
      const response = await fetch(`/api/business-hours?id=${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setBusinessHours(businessHours.filter(bh => bh.id !== id))
        alert('営業時間を削除しました')
      } else {
        const data = await response.json()
        alert(data.error || '営業時間の削除に失敗しました')
      }
    } catch (error) {
      console.error('Delete business hour error:', error)
      alert('営業時間の削除に失敗しました')
    }
  }

  const getDayName = (day_of_week: number) => {
    const days = ['日', '月', '火', '水', '木', '金', '土']
    return days[day_of_week]
  }

  const generateTimeOptions = () => {
    const options = []
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        options.push(timeString)
      }
    }
    return options
  }

  const exportToJson = () => {
    const dataStr = JSON.stringify(reservations, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `reservations_${format(new Date(), 'yyyy-MM-dd')}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const exportToCsv = () => {
    const headers = ['名前', '会員種別', '予約日時', '備考', '作成日時']
    const csvContent = [
      headers.join(','),
      ...reservations.map(r => [
        r.name,
        r.member_type === 'regular' ? '会員' : 'ゲスト',
        formatTz(new Date(r.datetime), 'yyyy/M/d HH:mm', { timeZone: 'Asia/Tokyo' }),
        r.note || '',
        formatTz(new Date(r.created_at), 'yyyy/M/d HH:mm', { timeZone: 'Asia/Tokyo' })
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const dataUri = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvContent)
    const exportFileDefaultName = `reservations_${format(new Date(), 'yyyy-MM-dd')}.csv`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const formatDateTime = (datetime: string) => {
    return formatTz(
      new Date(datetime),
      'yyyy/M/d HH:mm',
      { timeZone: 'Asia/Tokyo' }
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              管理画面
            </h2>
          </div>
          <form onSubmit={handleAuth} className="mt-8 space-y-6">
            <div>
              <label htmlFor="password" className="sr-only">
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="パスワード"
              />
            </div>
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                ログイン
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">予約管理画面</h1>
          <p className="mt-2 text-gray-600">予約の確認と営業時間の管理ができます</p>
        </div>

        <div className="mb-6">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('reservations')}
              className={`px-4 py-2 rounded-md font-medium ${
                activeTab === 'reservations'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              予約一覧
            </button>
            <button
              onClick={() => setActiveTab('business-hours')}
              className={`px-4 py-2 rounded-md font-medium ${
                activeTab === 'business-hours'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              営業時間管理
            </button>
          </nav>
        </div>

        {activeTab === 'reservations' && (
          <>
            <div className="mb-6 flex space-x-4">
              <button
                onClick={exportToJson}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                JSON出力
              </button>
              <button
                onClick={exportToCsv}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                CSV出力
              </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      名前
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      会員種別
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      予約日時
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      備考
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      予約作成日時
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reservations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        予約がありません
                      </td>
                    </tr>
                  ) : (
                    reservations.map((reservation) => (
                      <tr key={reservation.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {reservation.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            reservation.member_type === 'regular' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {reservation.member_type === 'regular' ? '会員' : 'ゲスト'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDateTime(reservation.datetime)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {reservation.note || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateTime(reservation.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'business-hours' && (
          <>
            <div className="mb-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">新しい営業時間を追加</h2>
                <form onSubmit={createBusinessHour} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700">
                        曜日
                      </label>
                      <select
                        id="dayOfWeek"
                        value={newBusinessHour.day_of_week}
                        onChange={(e) => setNewBusinessHour({...newBusinessHour, day_of_week: parseInt(e.target.value)})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value={1}>月曜日</option>
                        <option value={2}>火曜日</option>
                        <option value={3}>水曜日</option>
                        <option value={4}>木曜日</option>
                        <option value={5}>金曜日</option>
                        <option value={6}>土曜日</option>
                        <option value={0}>日曜日</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                        開始時間
                      </label>
                      <select
                        id="startTime"
                        value={newBusinessHour.start_time}
                        onChange={(e) => setNewBusinessHour({...newBusinessHour, start_time: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        {generateTimeOptions().map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                        終了時間
                      </label>
                      <select
                        id="endTime"
                        value={newBusinessHour.end_time}
                        onChange={(e) => setNewBusinessHour({...newBusinessHour, end_time: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        {generateTimeOptions().map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        追加
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">現在の営業時間</h2>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      曜日
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      開始時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      終了時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      30分刻みスロット数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {businessHours.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        営業時間が設定されていません
                      </td>
                    </tr>
                  ) : (
                    businessHours.map((businessHour) => {
                      const startTime = new Date(`2000-01-01T${businessHour.start_time}`)
                      const endTime = new Date(`2000-01-01T${businessHour.end_time}`)
                      const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60)
                      const slotCount = Math.floor(durationMinutes / 30)
                      
                      return (
                        <tr key={businessHour.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {getDayName(businessHour.day_of_week)}曜日
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {businessHour.start_time}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {businessHour.end_time}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {slotCount}個
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => deleteBusinessHour(businessHour.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              削除
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}