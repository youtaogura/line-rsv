import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import React, { useState } from 'react';
import { TimeSelector } from './TimeSelector';

interface BusinessHourDialogProps {
  onCreateBusinessHour: (businessHour: {
    day_of_week: number;
    start_time: string;
    end_time: string;
  }) => Promise<boolean>;
}

export const BusinessHourDialog: React.FC<BusinessHourDialogProps> = ({
  onCreateBusinessHour,
}) => {
  const [businessHour, setBusinessHour] = useState({
    day_of_week: 1,
    start_hour: '09',
    start_minute: '00',
    end_hour: '18',
    end_minute: '00',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await onCreateBusinessHour({
      day_of_week: businessHour.day_of_week,
      start_time: `${businessHour.start_hour}:${businessHour.start_minute}`,
      end_time: `${businessHour.end_hour}:${businessHour.end_minute}`,
    });
    if (success) {
      setBusinessHour({
        day_of_week: 1,
        start_hour: '09',
        start_minute: '00',
        end_hour: '18',
        end_minute: '00',
      });
      setIsOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setBusinessHour({
        day_of_week: 1,
        start_hour: '09',
        start_minute: '00',
        end_hour: '18',
        end_minute: '00',
      });
    }
  };

  const dayOptions = [
    { value: 1, label: '月曜日' },
    { value: 2, label: '火曜日' },
    { value: 3, label: '水曜日' },
    { value: 4, label: '木曜日' },
    { value: 5, label: '金曜日' },
    { value: 6, label: '土曜日' },
    { value: 0, label: '日曜日' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          営業時間を追加
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>営業時間を追加</DialogTitle>
          <DialogDescription>
            新しい営業時間を設定してください。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dayOfWeek" className="text-right">
                曜日
              </Label>
              <Select
                value={businessHour.day_of_week.toString()}
                onValueChange={(value) =>
                  setBusinessHour({
                    ...businessHour,
                    day_of_week: parseInt(value),
                  })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dayOptions.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <div className="text-right pt-2">
                <Label>開始時間</Label>
              </div>
              <div className="col-span-3">
                <TimeSelector
                  label=""
                  hour={businessHour.start_hour}
                  minute={businessHour.start_minute}
                  onHourChange={(value) =>
                    setBusinessHour({
                      ...businessHour,
                      start_hour: value,
                    })
                  }
                  onMinuteChange={(value) =>
                    setBusinessHour({
                      ...businessHour,
                      start_minute: value,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <div className="text-right pt-2">
                <Label>終了時間</Label>
              </div>
              <div className="col-span-3">
                <TimeSelector
                  label=""
                  hour={businessHour.end_hour}
                  minute={businessHour.end_minute}
                  onHourChange={(value) =>
                    setBusinessHour({
                      ...businessHour,
                      end_hour: value,
                    })
                  }
                  onMinuteChange={(value) =>
                    setBusinessHour({
                      ...businessHour,
                      end_minute: value,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '追加中...' : '追加'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
