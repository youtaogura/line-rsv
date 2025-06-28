interface CalendarTileProps {
  isAvailable: boolean;
  reservationCount: number;
  showNothing?: boolean;
}

export function CalendarTile({
  isAvailable,
  reservationCount,
  showNothing,
}: CalendarTileProps) {
  const getIndicator = () => {
    if (showNothing) {
      return <></>;
    }

    // 予約数がある場合はバッジを表示
    if (reservationCount > 0) {
      // インジケーターを非表示にする場合
      return (
        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-blue-500 rounded-full min-w-[20px]">
          {reservationCount}
        </span>
      );
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
