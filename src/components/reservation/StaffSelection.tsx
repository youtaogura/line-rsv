'use client';

import type { StaffMember } from '@/lib/supabase';

interface StaffSelectionProps {
  staffMembers: StaffMember[];
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        担当スタッフ選択
      </h2>
      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="radio"
            name="staff"
            value=""
            checked={selectedStaffId === ''}
            onChange={(e) => onStaffSelect(e.target.value)}
            className="mr-3"
          />
          <span>スタッフを指定しない（どのスタッフでも可）</span>
        </label>
        {staffMembers.map((staff) => (
          <label key={staff.id} className="flex items-center">
            <input
              type="radio"
              name="staff"
              value={staff.id}
              checked={selectedStaffId === staff.id}
              onChange={(e) => onStaffSelect(e.target.value)}
              className="mr-3"
            />
            <span>{staff.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
