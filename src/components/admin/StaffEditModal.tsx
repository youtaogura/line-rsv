import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { StaffMemberBusinessHourManager } from './StaffMemberBusinessHourManager';

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

interface StaffEditModalProps {
  isOpen: boolean;
  staffMember: StaffMember | null;
  onClose: () => void;
  onUpdateStaffMember: (id: string, name: string) => Promise<boolean>;
  businessHours: BusinessHourSimple[];
  tenantBusinessHours: BusinessHourSimple[];
  businessHoursLoading: boolean;
  onCreateBusinessHour: (
    staffMemberId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string
  ) => Promise<void>;
  onDeleteBusinessHour: (id: string) => Promise<void>;
}

export const StaffEditModal: React.FC<StaffEditModalProps> = ({
  isOpen,
  staffMember,
  onClose,
  onUpdateStaffMember,
  businessHours,
  tenantBusinessHours,
  businessHoursLoading,
  onCreateBusinessHour,
  onDeleteBusinessHour,
}) => {
  const [activeTab, setActiveTab] = useState('info');
  const [staffName, setStaffName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (staffMember) {
      setStaffName(staffMember.name);
    }
    // Reset to info tab when modal opens
    setActiveTab('info');
  }, [staffMember]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffMember || !staffName.trim()) return;

    setIsUpdating(true);
    try {
      const success = await onUpdateStaffMember(
        staffMember.id,
        staffName.trim()
      );
      if (success) {
        // Keep modal open but show success feedback
        alert('スタッフ情報が更新されました');
      }
    } catch (error) {
      console.error('Error updating staff member:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setStaffName('');
    setActiveTab('info');
    onClose();
  };

  if (!staffMember) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>{staffMember.name}の設定</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="info" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>基本情報</span>
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              className="flex items-center space-x-2"
            >
              <Clock className="h-4 w-4" />
              <span>対応時間設定</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-2">
            <h3 className="text-md font-semibold">基本情報</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="staff-name">
                  スタッフ名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="staff-name"
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  required
                  placeholder="スタッフ名を入力"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  閉じる
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isUpdating ||
                    !staffName.trim() ||
                    staffName === staffMember.name
                  }
                >
                  {isUpdating ? '更新中...' : '更新'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4 mt-2">
            <h3 className="text-md font-semibold">対応時間設定</h3>
            <StaffMemberBusinessHourManager
              staffMember={staffMember}
              onClose={() => {}} // Don't close the entire modal, just stay on this tab
              businessHours={businessHours}
              tenantBusinessHours={tenantBusinessHours}
              loading={businessHoursLoading}
              onCreateBusinessHour={onCreateBusinessHour}
              onDeleteBusinessHour={onDeleteBusinessHour}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
