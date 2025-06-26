import React from 'react'
import Calendar from 'react-calendar'
import { CalendarTile } from './CalendarTile'
import { DayAvailability } from '../types'
import { format, isBefore, startOfDay } from 'date-fns'
import 'react-calendar/dist/Calendar.css'
import './calendar-styles.css'

interface CalendarViewProps {
  selectedDate: Date | null
  onDateChange: (date: Date) => void
  currentMonth: Date
  onActiveStartDateChange: (activeStartDate: Date) => void
  availabilityData: DayAvailability[]
  loading: boolean
}

export function CalendarView({
  selectedDate,
  onDateChange,
  currentMonth,
  onActiveStartDateChange,
  availabilityData,
  loading
}: CalendarViewProps) {
  const today = startOfDay(new Date())

  const getTileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return ''
    
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayAvailability = availabilityData.find(item => item.date === dateStr)
    const isPastDate = isBefore(startOfDay(date), today)
    const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateStr

    let classes = 'relative '

    if (isPastDate || !dayAvailability?.hasAvailability) {
      classes += 'bg-gray-200 text-gray-400 cursor-not-allowed '
    } else {
      classes += 'bg-white hover:bg-blue-50 cursor-pointer '
    }

    if (isSelected && !isPastDate && dayAvailability?.hasAvailability) {
      classes += 'bg-blue-500 text-white hover:bg-blue-600 '
    }

    return classes.trim()
  }

  const getTileDisabled = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return false
    
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayAvailability = availabilityData.find(item => item.date === dateStr)
    const isPastDate = isBefore(startOfDay(date), today)
    
    return isPastDate || !dayAvailability?.hasAvailability
  }

  const getTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null
    
    return (
      <CalendarTile 
        date={date} 
        availabilityData={availabilityData}
      />
    )
  }

  const handleDateClick = (value: Date | Date[] | null | [Date | null, Date | null]) => {
    if (value && !Array.isArray(value)) {
      const dateStr = format(value, 'yyyy-MM-dd')
      const dayAvailability = availabilityData.find(item => item.date === dateStr)
      const isPastDate = isBefore(startOfDay(value), today)
      
      if (!isPastDate && dayAvailability?.hasAvailability) {
        onDateChange(value)
      }
    }
  }

  const handleActiveStartDateChange = ({ activeStartDate }: { activeStartDate: Date | null }) => {
    if (activeStartDate) {
      onActiveStartDateChange(activeStartDate)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80 bg-gray-50 rounded-lg">
        <div className="text-gray-500">カレンダーを読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <Calendar
        value={selectedDate}
        onChange={handleDateClick}
        activeStartDate={currentMonth}
        onActiveStartDateChange={handleActiveStartDateChange}
        tileClassName={getTileClassName}
        tileDisabled={getTileDisabled}
        tileContent={getTileContent}
        locale="ja-JP"
        minDate={today}
        maxDetail="month"
        minDetail="month"
        className="w-full border-0 bg-white rounded-lg shadow-sm"
      />
    </div>
  )
}