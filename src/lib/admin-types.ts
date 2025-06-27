import { format } from 'date-fns'
import { format as formatTz } from 'date-fns-tz'

export interface AdminSession {
  user: {
    id: string
    name?: string | null
    username: string
    tenant_id: string
  }
}

export const getDayName = (day_of_week: number): string => {
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return days[day_of_week]
}

export const generateTimeOptions = (): string[] => {
  const options = []
  for (let hour = 9; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      options.push(timeString)
    }
  }
  return options
}

export const formatDateTime = (datetime: string): string => {
  return formatTz(
    new Date(datetime),
    'yyyy/M/d HH:mm',
    { timeZone: 'Asia/Tokyo' }
  )
}

export const exportToJson = (data: unknown[], filename: string): void => {
  const dataStr = JSON.stringify(data, null, 2)
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
  
  const exportFileDefaultName = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.json`
  
  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', exportFileDefaultName)
  linkElement.click()
}

export const exportToCsv = (data: unknown[], headers: string[], rowMapper: (item: unknown) => string[], filename: string): void => {
  const csvContent = [
    headers.join(','),
    ...data.map(item => rowMapper(item).map(field => `"${field}"`).join(','))
  ].join('\n')

  const dataUri = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvContent)
  const exportFileDefaultName = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`
  
  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', exportFileDefaultName)
  linkElement.click()
}