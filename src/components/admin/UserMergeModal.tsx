import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, ArrowRight, Phone } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { MemberTypeBadge } from '../common';

// ローカル型定義
interface User {
  user_id: string;
  name: string;
  member_type: 'regular' | 'guest';
  phone?: string;
}

interface UserMergeModalProps {
  isOpen: boolean;
  user: User | null;
  allUsers: User[];
  onClose: () => void;
  onMergeUser: (sourceUserId: string, targetUserId: string) => Promise<boolean>;
}

export const UserMergeModal: React.FC<UserMergeModalProps> = ({
  isOpen,
  user,
  allUsers,
  onClose,
  onMergeUser,
}) => {
  const [selectedTargetUserId, setSelectedTargetUserId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMerging, setIsMerging] = useState(false);

  // 統合先候補ユーザー（正会員のみ、自分以外）
  const targetUsers = useMemo(() => {
    if (!user) return [];

    return allUsers
      .filter(
        (u) =>
          u.member_type === 'regular' &&
          u.user_id !== user.user_id &&
          u.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allUsers, user, searchTerm]);

  const selectedTargetUser = useMemo(() => {
    return allUsers.find((u) => u.user_id === selectedTargetUserId);
  }, [allUsers, selectedTargetUserId]);

  useEffect(() => {
    // モーダルが開かれた時に状態をリセット
    setSelectedTargetUserId('');
    setSearchTerm('');
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTargetUserId) return;

    const targetUser = allUsers.find((u) => u.user_id === selectedTargetUserId);
    if (!targetUser) {
      alert('選択されたユーザーが見つかりません');
      return;
    }

    const confirmMessage = `ユーザーを統合します。\n\n統合されるデータ：\n- 予約情報\n- 電話番号（統合先に登録されていない場合）\n\n統合元のユーザーは削除されます。`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsMerging(true);

    try {
      await onMergeUser(user.user_id, selectedTargetUserId);
    } catch (error) {
      console.error('Error merging user:', error);
    } finally {
      setIsMerging(false);
    }
  };

  const handleClose = () => {
    setSelectedTargetUserId('');
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <span>ユーザー統合</span>
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-primary/90">
          管理者用ページから予約登録したユーザーと、新たにLINEから予約登録したユーザーが同一のお客様の場合、統合機能を使って予約情報やユーザー情報を一つのユーザーにまとめることができます。
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 統合元ユーザー表示 */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="px-3 py-1">
              <h4 className="text-sm font-semibold text-amber-800 mb-1">
                統合元ユーザー
              </h4>
              <div>
                <p className="font-medium">{user?.name}</p>
                {user?.phone && (
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Phone className="inline h-4 w-4 mr-1" />
                    {user.phone}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 統合先ユーザー検索 */}
          <div className="space-y-3">
            <Label htmlFor="search">
              統合先ユーザーを検索 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="会員名で検索..."
            />
          </div>

          {/* 統合先ユーザー選択 */}
          {searchTerm && targetUsers.length > 0 && (
            <div className="space-y-3">
              <Label>統合先ユーザー選択</Label>
              <div className="max-h-60 overflow-y-auto border rounded-xs">
                <RadioGroup
                  value={selectedTargetUserId}
                  onValueChange={setSelectedTargetUserId}
                >
                  {targetUsers.map((targetUser) => (
                    <div
                      key={targetUser.user_id}
                      className="flex items-center space-x-3 p-3 hover:bg-muted/50 border-b last:border-b-0"
                    >
                      <RadioGroupItem
                        value={targetUser.user_id}
                        id={targetUser.user_id}
                      />
                      <label
                        htmlFor={targetUser.user_id}
                        className="flex-1 cursor-pointer"
                      >
                        <div>
                          <p className="font-medium">{targetUser.name}</p>
                          {targetUser.phone && (
                            <p className="text-sm text-muted-foreground">
                              {targetUser.phone}
                            </p>
                          )}
                        </div>
                      </label>
                      <MemberTypeBadge memberType={targetUser.member_type} />
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {/* 統合プレビュー */}
          {selectedTargetUser && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <div className="text-center">
                    <p className="font-medium">{user?.name}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary" />
                  <div className="text-center">
                    <p className="font-medium">{selectedTargetUser.name}</p>
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="space-y-2 text-sm text-red-700">
                  <h5 className="font-medium">統合後の結果:</h5>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>予約データが統合先に移行されます</li>
                    <li>統合元のユーザーは削除されます</li>
                    <li>電話番号などの情報が統合されます</li>
                    <li>この操作は取り消せません</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isMerging}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isMerging || !selectedTargetUserId}>
              {isMerging ? '統合中...' : '統合実行'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
