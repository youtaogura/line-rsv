import { LoadingSpinner } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DAYS_OF_WEEK } from '@/constants/time';
import { AlertTriangle, Clock, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { TimeSelector } from './TimeSelector';

// ローカル型定義
interface StaffMember {
  id: string;
  name: string;
}

interface BusinessHourSimple {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface StaffMemberBusinessHourManagerProps {
  staffMember: StaffMember;
  onClose?: () => void;
  businessHours: BusinessHourSimple[];
  tenantBusinessHours: BusinessHourSimple[];
  loading: boolean;
  onCreateBusinessHour: (
    staffMemberId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string
  ) => Promise<void>;
  onDeleteBusinessHour: (id: string) => Promise<void>;
  onCreateAllHours: (staffMemberId: string, dayOfWeek: number) => Promise<void>;
}

export const StaffMemberBusinessHourManager: React.FC<
  StaffMemberBusinessHourManagerProps
> = ({
  staffMember,
  onClose: _onClose,
  businessHours,
  tenantBusinessHours,
  loading,
  onCreateBusinessHour,
  onDeleteBusinessHour,
  onCreateAllHours,
}) => {
  const [dayOfWeek, setDayOfWeek] = useState(1); // 月曜日
  const [startHour, setStartHour] = useState('09');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('18');
  const [endMinute, setEndMinute] = useState('00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingAllHours, setIsCreatingAllHours] = useState(false);
  const [_errorMessage, setErrorMessage] = useState('');

  // テナントの営業時間を取得する関数
  const getTenantBusinessHoursForDay = (day: number) => {
    return tenantBusinessHours.filter((hour) => hour.day_of_week === day);
  };

  // 選択された曜日のテナント営業時間があるかチェック
  const selectedDayTenantHours = getTenantBusinessHoursForDay(dayOfWeek);
  const isDayAvailable = selectedDayTenantHours.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    setIsSubmitting(true);
    try {
      const startTime = `${startHour}:${startMinute}`;
      const endTime = `${endHour}:${endMinute}`;
      await onCreateBusinessHour(staffMember.id, dayOfWeek, startTime, endTime);
      setDayOfWeek(1);
      setStartHour('09');
      setStartMinute('00');
      setEndHour('18');
      setEndMinute('00');
    } catch (error) {
      console.error('Failed to create business hour:', error);
      setErrorMessage('営業時間の追加に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeleteBusinessHour(id);
    } catch (error) {
      console.error('Failed to delete business hour:', error);
      alert('営業時間の削除に失敗しました');
    }
  };

  const handleCreateAllHours = async () => {
    alert('現在の設定は上書きされます。よろしいですか？');
    setIsCreatingAllHours(true);
    setErrorMessage('');

    try {
      await onCreateAllHours(staffMember.id, dayOfWeek);
      alert('営業時間全てを対応可能に設定しました');
    } catch (error) {
      console.error('Failed to create all hours:', error);
      setErrorMessage('設定に失敗しました');
    } finally {
      setIsCreatingAllHours(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-2">
      {/* 営業時間追加フォーム */}
      <h3 className="flex items-center space-x-2 text-md font-medium mb-2">
        <Plus className="h-4 w-4" />
        <span>対応可能時間を追加</span>
      </h3>

      <Card>
        <CardContent className="px-3 py-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
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
                    {DAYS_OF_WEEK.map((day, index) => {
                      const dayTenantHours =
                        getTenantBusinessHoursForDay(index);
                      const hasOperatingHours = dayTenantHours.length > 0;
                      return (
                        <SelectItem
                          key={index}
                          value={index.toString()}
                          disabled={!hasOperatingHours}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{day}</span>
                            {!hasOperatingHours && (
                              <span className="text-xs text-muted-foreground ml-2">
                                (営業日ではありません)
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <TimeSelector
                label="開始時間"
                hour={startHour}
                minute={startMinute}
                onHourChange={setStartHour}
                onMinuteChange={setStartMinute}
                disabled={!isDayAvailable}
              />
              <TimeSelector
                label="終了時間"
                hour={endHour}
                minute={endMinute}
                onHourChange={setEndHour}
                onMinuteChange={setEndMinute}
                disabled={!isDayAvailable}
              />
            </div>

            {/* テナント営業時間の情報表示 */}
            {isDayAvailable && selectedDayTenantHours.length > 0 && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-xs">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">
                      テナント営業時間: {DAYS_OF_WEEK[dayOfWeek]}
                    </p>
                    <div className="mt-1">
                      {selectedDayTenantHours.map((hour, index) => (
                        <span key={hour.id}>
                          {hour.start_time.slice(0, -3)} -{' '}
                          {hour.end_time.slice(0, -3)}
                          {index < selectedDayTenantHours.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                    <p className="mt-1 text-xs">
                      スタッフの対応時間はこの営業時間内に設定してください
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!isDayAvailable && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xs">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">
                      {DAYS_OF_WEEK[dayOfWeek]}はテナントの営業日ではありません
                    </p>
                    <p className="mt-1 text-xs">
                      まずテナントの営業時間を設定してください
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button
                type="submit"
                disabled={isSubmitting || !isDayAvailable}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>{isSubmitting ? '追加中...' : '営業時間を追加'}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCreateAllHours}
                disabled={isCreatingAllHours || !isDayAvailable}
                className="flex items-center space-x-2"
              >
                <Clock className="h-4 w-4" />
                <span>
                  {isCreatingAllHours ? '設定中...' : '全時間対応可能にする'}
                </span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 現在の営業時間一覧 */}
      <div className="space-y-4">
        <h3 className="flex items-center space-x-2 text-md font-medium mt-4 mb-2">
          <Clock className="h-4 w-4" />
          <span>現在の営業時間</span>
        </h3>

        {businessHours.length === 0 ? (
          <Card>
            <CardContent className="p-2 text-center text-muted-foreground">
              営業時間が設定されていません
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {(() => {
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
                  {} as Record<number, typeof businessHours>
                );

                // 各曜日の営業時間を開始時間順にソート
                Object.keys(groupedByDay).forEach((dayKey) => {
                  groupedByDay[parseInt(dayKey)].sort((a, b) =>
                    a.start_time.localeCompare(b.start_time)
                  );
                });

                // 曜日順にソート
                const sortedDayKeys = Object.keys(groupedByDay)
                  .map((key) => parseInt(key))
                  .sort((a, b) => a - b);

                return sortedDayKeys.map((dayOfWeek) => {
                  const dayHours = groupedByDay[dayOfWeek];
                  return (
                    <Card key={dayOfWeek} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-lg">
                              {DAYS_OF_WEEK[dayOfWeek]}
                            </div>
                            <div className="mt-2 space-y-2">
                              {dayHours.map((hour) => (
                                <div
                                  key={hour.id}
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex items-center space-x-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                      {hour.start_time} - {hour.end_time}
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(hour.id)}
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
                });
              })()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
