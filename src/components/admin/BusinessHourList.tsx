import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getDayName } from '@/lib/admin-types';
import type { BusinessHour } from '@/lib/supabase';
import { Clock, Trash2 } from 'lucide-react';
import React from 'react';

interface BusinessHourListProps {
  businessHours: BusinessHour[];
  onDeleteBusinessHour: (id: string) => Promise<void>;
}

export const BusinessHourList: React.FC<BusinessHourListProps> = ({
  businessHours,
  onDeleteBusinessHour,
}) => {
  // 曜日ごとにグループ化
  const groupedByDay = businessHours.reduce(
    (acc, hour) => {
      const dayKey = hour.day_of_week;
      if (!acc[dayKey]) {
        acc[dayKey] = [];
      }
      acc[dayKey].push(hour);
      return acc;
    },
    {} as Record<number, BusinessHour[]>
  );

  // 各曜日の営業時間を開始時間順にソート
  Object.keys(groupedByDay).forEach((dayKey) => {
    groupedByDay[parseInt(dayKey)].sort((a, b) =>
      a.start_time.localeCompare(b.start_time)
    );
  });

  // 曜日順にソート（0=日曜日から6=土曜日）
  const sortedDayKeys = Object.keys(groupedByDay)
    .map((key) => parseInt(key))
    .sort((a, b) => a - b);

  return (
    <div className="space-y-2">
      {businessHours.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          営業時間が設定されていません
        </div>
      ) : (
        sortedDayKeys.map((dayOfWeek) => {
          const dayHours = groupedByDay[dayOfWeek];
          return (
            <Card key={dayOfWeek} className="border">
              <CardContent className="px-3 py-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-md">
                      {getDayName(dayOfWeek)}曜日
                    </h3>
                    <div className="mt-1">
                      {dayHours.map((businessHour) => (
                        <div
                          key={businessHour.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {businessHour.start_time.slice(0, -3)} -{' '}
                              {businessHour.end_time.slice(0, -3)}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              onDeleteBusinessHour(businessHour.id)
                            }
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};
