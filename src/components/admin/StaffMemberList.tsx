import React, { useState } from "react";
import type { StaffMember } from "@/lib/supabase";
import { Modal, DateTimeDisplay } from "@/components/common";
import { StaffMemberBusinessHourManager } from "./StaffMemberBusinessHourManager";
import { UI_TEXT } from "@/constants/ui";

interface StaffMemberListProps {
  staffMembers: StaffMember[];
  onUpdateStaffMember: (id: string, name: string) => Promise<boolean>;
  onDeleteStaffMember: (id: string) => Promise<void>;
}

export const StaffMemberList: React.FC<StaffMemberListProps> = ({
  staffMembers,
  onUpdateStaffMember,
  onDeleteStaffMember,
}) => {
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editName, setEditName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStaffForSchedule, setSelectedStaffForSchedule] = useState<StaffMember | null>(null);

  const handleEditClick = (staff: StaffMember) => {
    setEditingStaff(staff);
    setEditName(staff.name);
  };

  const handleEditCancel = () => {
    setEditingStaff(null);
    setEditName("");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !editName.trim()) return;

    setIsUpdating(true);
    const success = await onUpdateStaffMember(editingStaff.id, editName.trim());
    if (success) {
      setEditingStaff(null);
      setEditName("");
    }
    setIsUpdating(false);
  };

  const handleScheduleClick = (staff: StaffMember) => {
    setSelectedStaffForSchedule(staff);
  };

  return (
    <>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">スタッフ一覧</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                名前
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                作成日時
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staffMembers.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  スタッフが登録されていません
                </td>
              </tr>
            ) : (
              staffMembers.map((staff) => (
                <tr key={staff.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {editingStaff?.id === staff.id ? (
                      <form onSubmit={handleEditSubmit} className="flex space-x-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        />
                        <button
                          type="submit"
                          disabled={!editName.trim() || isUpdating}
                          className="bg-blue-600 text-white py-1 px-2 rounded text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          保存
                        </button>
                        <button
                          type="button"
                          onClick={handleEditCancel}
                          disabled={isUpdating}
                          className="bg-gray-600 text-white py-1 px-2 rounded text-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          キャンセル
                        </button>
                      </form>
                    ) : (
                      staff.name
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <DateTimeDisplay datetime={staff.created_at} format="short" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      {editingStaff?.id !== staff.id && (
                        <>
                          <button
                            onClick={() => handleEditClick(staff)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleScheduleClick(staff)}
                            className="text-green-600 hover:text-green-900"
                          >
                            対応時間設定
                          </button>
                          <button
                            onClick={() => onDeleteStaffMember(staff.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            {UI_TEXT.DELETE}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* スタッフの対応時間設定モーダル */}
      {selectedStaffForSchedule && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedStaffForSchedule(null)}
          title={`${selectedStaffForSchedule.name}の対応時間設定`}
        >
          <StaffMemberBusinessHourManager
            staffMember={selectedStaffForSchedule}
            onClose={() => setSelectedStaffForSchedule(null)}
          />
        </Modal>
      )}
    </>
  );
};