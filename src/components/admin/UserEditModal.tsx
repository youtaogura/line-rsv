import React, { useState, useEffect } from 'react';
import type { User } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserEditModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onUpdateUser: (updateData: {
    name: string;
    phone: string;
    member_type: 'regular' | 'guest';
  }) => Promise<boolean>;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  isOpen,
  user,
  onClose,
  onUpdateUser,
}) => {
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    member_type: 'guest' as 'regular' | 'guest',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      setEditFormData({
        name: user.name,
        phone: user.phone || '',
        member_type: user.member_type,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);

    try {
      await onUpdateUser(editFormData);
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setEditFormData({
      name: '',
      phone: '',
      member_type: 'guest',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ユーザー情報編集</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              名前 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={editFormData.name}
              onChange={(e) =>
                setEditFormData({ ...editFormData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">電話番号</Label>
            <Input
              id="phone"
              type="tel"
              value={editFormData.phone}
              onChange={(e) =>
                setEditFormData({ ...editFormData, phone: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="member_type">
              会員種別 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={editFormData.member_type}
              onValueChange={(value) =>
                setEditFormData({
                  ...editFormData,
                  member_type: value as 'regular' | 'guest',
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="guest">ゲスト</SelectItem>
                <SelectItem value="regular">会員</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUpdating}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isUpdating || !editFormData.name.trim()}
            >
              {isUpdating ? '更新中...' : '更新'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
