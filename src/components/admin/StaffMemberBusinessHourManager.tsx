import React, { useState, useEffect } from "react";
import type { StaffMember } from "@/lib/supabase";
import { useStaffMemberBusinessHours } from "@/hooks/useAdminData";
import { LoadingSpinner } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Trash2, Plus } from "lucide-react";
import { DAYS_OF_WEEK } from "@/constants/time";

interface StaffMemberBusinessHourManagerProps {
  staffMember: StaffMember;
  onClose?: () => void;
}

export const StaffMemberBusinessHourManager: React.FC<StaffMemberBusinessHourManagerProps> = ({
  staffMember,
  onClose: _onClose,
}) => {
  const {
    businessHours,
    loading,
    fetchStaffMemberBusinessHours,
    createStaffMemberBusinessHour,
    deleteStaffMemberBusinessHour,
  } = useStaffMemberBusinessHours();

  const [dayOfWeek, setDayOfWeek] = useState(1); // 月曜日
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchStaffMemberBusinessHours(staffMember.id);
  }, [staffMember.id, fetchStaffMemberBusinessHours]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    const success = await createStaffMemberBusinessHour({
      staff_member_id: staffMember.id,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
    });
    
    if (success) {
      setDayOfWeek(1);
      setStartTime("09:00");
      setEndTime("18:00");
      // 再取得
      await fetchStaffMemberBusinessHours(staffMember.id);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    await deleteStaffMemberBusinessHour(id);
    // 再取得
    await fetchStaffMemberBusinessHours(staffMember.id);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* 営業時間追加フォーム */}
      <Card className="border-dashed">
        <CardContent className="p-6">
          <h3 className="flex items-center space-x-2 text-lg font-medium mb-4">
            <Plus className="h-5 w-5" />
            <span>新しい営業時間を追加</span>
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dayOfWeek">曜日</Label>
                <Select 
                  value={dayOfWeek.toString()} 
                  onValueChange={(value) => setDayOfWeek(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">開始時間</Label>
                <Input
                  type="time"
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  min="09:00"
                  max="18:00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">終了時間</Label>
                <Input
                  type="time"
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  min="09:00"
                  max="18:00"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>{isSubmitting ? "追加中..." : "営業時間を追加"}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 現在の営業時間一覧 */}
      <div className="space-y-4">
        <h3 className="flex items-center space-x-2 text-lg font-medium">
          <Clock className="h-5 w-5" />
          <span>現在の営業時間</span>
        </h3>
        
        {businessHours.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              営業時間が設定されていません
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <Card>
                <CardContent className="p-0">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          曜日
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          時間
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {businessHours.map((hour) => (
                        <tr key={hour.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {DAYS_OF_WEEK[hour.day_of_week]}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {hour.start_time} - {hour.end_time}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(hour.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              削除
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {businessHours.map((hour) => (
                <Card key={hour.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-lg">
                          {DAYS_OF_WEEK[hour.day_of_week]}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {hour.start_time} - {hour.end_time}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(hour.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-4"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};