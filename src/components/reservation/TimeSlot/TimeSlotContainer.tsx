interface TimeSlotContainerProps {
  children: React.ReactNode
  title: string
}

export function TimeSlotContainer({ children, title }: TimeSlotContainerProps) {
  return (
    <div className="w-full">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
        <div className="space-y-2">
          {children}
        </div>
      </div>
    </div>
  )
}