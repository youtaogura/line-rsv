import React from 'react'
import type { Reservation } from '@/lib/supabase'
import { exportToJson, exportToCsv, formatDateTime } from '@/lib/admin-types'

interface ReservationExportProps {
  reservations: Reservation[]
}

export const ReservationExport: React.FC<ReservationExportProps> = ({
  reservations
}) => {
  const handleExportToJson = () => {
    exportToJson(reservations, 'reservations')
  }

  const handleExportToCsv = () => {
    const headers = ['名前', '会員種別', '予約日時', '備考', '作成日時']
    
    const rowMapper = (reservation: unknown) => {
      const r = reservation as Reservation
      return [
        r.name,
        r.member_type === 'regular' ? '会員' : 'ゲスト',
        formatDateTime(r.datetime),
        r.note || '',
        formatDateTime(r.created_at)
      ]
    }

    exportToCsv(reservations, headers, rowMapper, 'reservations')
  }

  return (
    <div className="flex space-x-4">
      <button
        onClick={handleExportToJson}
        className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover"
      >
        JSON出力
      </button>
      <button
        onClick={handleExportToCsv}
        className="bg-success text-white px-4 py-2 rounded-md hover:bg-success/90"
      >
        CSV出力
      </button>
    </div>
  )
}