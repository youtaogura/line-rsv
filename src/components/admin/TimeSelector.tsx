import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimeSelectorProps {
  label: string;
  hour: string;
  minute: string;
  onHourChange: (hour: string) => void;
  onMinuteChange: (minute: string) => void;
  disabled?: boolean;
}

export const TimeSelector: React.FC<TimeSelectorProps> = ({
  label,
  hour,
  minute,
  onHourChange,
  onMinuteChange,
  disabled = false,
}) => {
  // 時間の選択肢（00-23）
  const hourOptions = Array.from({ length: 24 }, (_, i) => 
    i.toString().padStart(2, '0')
  );

  // 分の選択肢（10分刻み）
  const minuteOptions = ['00', '10', '20', '30', '40', '50'];

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Select
          value={hour}
          onValueChange={onHourChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {hourOptions.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">時</span>
        <Select
          value={minute}
          onValueChange={onMinuteChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {minuteOptions.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">分</span>
      </div>
    </div>
  );
};