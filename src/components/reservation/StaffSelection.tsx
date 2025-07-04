'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { StaffMembersApiResponse } from '@/app/api/public/staff-members/route';

interface StaffSelectionProps {
  staffMembers: StaffMembersApiResponse;
  selectedStaffId: string;
  onStaffSelect: (staffId: string) => void;
}

export function StaffSelection({
  staffMembers,
  selectedStaffId,
  onStaffSelect,
}: StaffSelectionProps) {
  if (staffMembers.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xs shadow-sm border border-gray-200 p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        担当スタッフ選択
      </h2>
      <Select value={selectedStaffId} onValueChange={onStaffSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="担当スタッフを選択してください" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">
            スタッフを指定しない（どのスタッフでも可）
          </SelectItem>
          {staffMembers.map((staff) => (
            <SelectItem key={staff.id} value={staff.id}>
              {staff.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
