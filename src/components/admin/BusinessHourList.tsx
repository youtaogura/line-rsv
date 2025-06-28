import React from "react";
import type { BusinessHour } from "@/lib/supabase";
import { getDayName } from "@/lib/admin-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock, Trash2 } from "lucide-react";

interface BusinessHourListProps {
  businessHours: BusinessHour[];
  onDeleteBusinessHour: (id: string) => Promise<void>;
}

export const BusinessHourList: React.FC<BusinessHourListProps> = ({
  businessHours,
  onDeleteBusinessHour,
}) => {
  const sortedBusinessHours = businessHours
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
    .sort((a, b) => a.day_of_week - b.day_of_week);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>現在の営業時間</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  曜日
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  開始時間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  終了時間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {businessHours.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-muted-foreground">
                    営業時間が設定されていません
                  </td>
                </tr>
              ) : (
                sortedBusinessHours.map((businessHour) => (
                  <tr key={businessHour.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {getDayName(businessHour.day_of_week)}曜日
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {businessHour.start_time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {businessHour.end_time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteBusinessHour(businessHour.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        削除
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {businessHours.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              営業時間が設定されていません
            </div>
          ) : (
            sortedBusinessHours.map((businessHour) => (
              <Card key={businessHour.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {getDayName(businessHour.day_of_week)}曜日
                      </h3>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {businessHour.start_time} - {businessHour.end_time}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteBusinessHour(businessHour.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-4"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
