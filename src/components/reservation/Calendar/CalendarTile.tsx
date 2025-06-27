interface CalendarTileProps {
  isPast: boolean;
  isAvailable: boolean;
}

export function CalendarTile({
  isPast,
  isAvailable
}: CalendarTileProps) {
  const getIndicator = () => {
    if (isPast) {
      return <></>;
    }

    if (isAvailable) {
      return <span className="text-green-500 font-bold">⚪︎</span>;
    } else {
      return <span className="text-red-500 font-bold">×</span>;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-xs mb-1">{getIndicator()}</div>
    </div>
  );
}
