import React, { useState, useEffect, useMemo } from "react";
import type { User } from "@/lib/supabase";
import { Modal } from "./Modal";

type ModalMode = 'edit' | 'merge';

interface UserEditModalProps {
  isOpen: boolean;
  user: User | null;
  allUsers: User[];
  mode?: ModalMode;
  onClose: () => void;
  onUpdateUser: (updateData: {
    name: string;
    phone: string;
    member_type: "regular" | "guest";
  }) => Promise<boolean>;
  onMergeUser: (sourceUserId: string, targetUserId: string) => Promise<boolean>;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  isOpen,
  user,
  allUsers,
  mode = 'edit',
  onClose,
  onUpdateUser,
  onMergeUser,
}) => {
  const [editFormData, setEditFormData] = useState({
    name: "",
    phone: "",
    member_type: "guest" as "regular" | "guest",
  });
  const [selectedTargetUserId, setSelectedTargetUserId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // 統合先候補ユーザー（正会員のみ、自分以外）
  const targetUsers = useMemo(() => {
    if (!user || mode !== 'merge') return [];
    
    return allUsers
      .filter(u => 
        u.member_type === 'regular' && 
        u.user_id !== user.user_id &&
        u.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allUsers, user, mode, searchTerm]);

  useEffect(() => {
    if (user) {
      setEditFormData({
        name: user.name,
        phone: user.phone || "",
        member_type: user.member_type,
      });
    }
    // モード変更時に状態をリセット
    setSelectedTargetUserId("");
    setSearchTerm("");
  }, [user, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);

    try {
      if (mode === 'merge') {
        if (!selectedTargetUserId) {
          alert("統合先のユーザーを選択してください");
          return;
        }
        
        const targetUser = allUsers.find(u => u.user_id === selectedTargetUserId);
        if (!targetUser) {
          alert("選択されたユーザーが見つかりません");
          return;
        }

        const confirmMessage = `${user.name}（ゲスト）を ${targetUser.name}（会員）に統合しますか？\n\n統合されるデータ：\n- 予約情報\n- 電話番号（統合先に登録されていない場合）\n\n統合元のユーザーは削除されます。`;
        
        if (!confirm(confirmMessage)) {
          return;
        }

        await onMergeUser(user.user_id, selectedTargetUserId);
      } else {
        await onUpdateUser(editFormData);
      }
    } catch (error) {
      console.error("Error processing user:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setEditFormData({
      name: "",
      phone: "",
      member_type: "guest",
    });
    setSelectedTargetUserId("");
    setSearchTerm("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'merge' ? "ユーザー統合" : "ユーザー情報編集"}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'merge' ? (
          <>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-1">統合元ユーザー</h4>
              <p className="text-sm text-yellow-700">
                {user?.name} ({user?.member_type === 'guest' ? 'ゲスト' : '会員'})
                {user?.phone && ` - ${user.phone}`}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                統合先ユーザーを検索 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="会員名で検索..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary hover:border-gray-400 transition-colors mb-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                統合先ユーザー選択
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md">
                {targetUsers.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500 text-center">
                    {searchTerm ? '該当する会員が見つかりません' : '検索してください'}
                  </div>
                ) : (
                  targetUsers.map((targetUser) => (
                    <label 
                      key={targetUser.user_id}
                      className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                        selectedTargetUserId === targetUser.user_id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="targetUser"
                        value={targetUser.user_id}
                        checked={selectedTargetUserId === targetUser.user_id}
                        onChange={(e) => setSelectedTargetUserId(e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {targetUser.name}
                        </div>
                        {targetUser.phone && (
                          <div className="text-sm text-gray-500">
                            {targetUser.phone}
                          </div>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            {selectedTargetUserId && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <h4 className="text-sm font-medium text-blue-800 mb-1">統合後の結果</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 予約データが統合先に移行されます</li>
                  <li>• 統合元のユーザーは削除されます</li>
                  <li>• 電話番号などの情報が統合されます</li>
                </ul>
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                名前 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary hover:border-gray-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                電話番号
              </label>
              <input
                type="tel"
                value={editFormData.phone}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary hover:border-gray-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                会員種別 <span className="text-red-500">*</span>
              </label>
              <select
                value={editFormData.member_type}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    member_type: e.target.value as "regular" | "guest",
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary hover:border-gray-400 transition-colors"
              >
                <option value="guest">ゲスト</option>
                <option value="regular">会員</option>
              </select>
            </div>
          </>
        )}

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={handleClose}
            disabled={isUpdating}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={
              isUpdating || 
              (mode === 'merge' ? !selectedTargetUserId : !editFormData.name.trim())
            }
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isUpdating 
              ? (mode === 'merge' ? "統合中..." : "更新中...") 
              : (mode === 'merge' ? "統合実行" : "更新")
            }
          </button>
        </div>
      </form>
    </Modal>
  );
};
