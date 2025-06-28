import React, { useState, useEffect, useMemo } from "react";
import type { User } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangle, ArrowRight } from "lucide-react";

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
  const [selectedTargetUserId, setSelectedTargetUserId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isMerging, setIsMerging] = useState(false);

  // 統合先候補ユーザー（正会員のみ、自分以外）
  const targetUsers = useMemo(() => {
    if (!user) return [];
    
    return allUsers
      .filter(u => 
        u.member_type === 'regular' && 
        u.user_id !== user.user_id &&
        u.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allUsers, user, searchTerm]);

  const selectedTargetUser = useMemo(() => {
    return allUsers.find(u => u.user_id === selectedTargetUserId);
  }, [allUsers, selectedTargetUserId]);

  useEffect(() => {
    // モーダルが開かれた時に状態をリセット
    setSelectedTargetUserId("");
    setSearchTerm("");
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTargetUserId) return;

    const targetUser = allUsers.find(u => u.user_id === selectedTargetUserId);
    if (!targetUser) {
      alert("選択されたユーザーが見つかりません");
      return;
    }

    const confirmMessage = `${user.name}（ゲスト）を ${targetUser.name}（会員）に統合しますか？\n\n統合されるデータ：\n- 予約情報\n- 電話番号（統合先に登録されていない場合）\n\n統合元のユーザーは削除されます。`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsMerging(true);

    try {
      await onMergeUser(user.user_id, selectedTargetUserId);
    } catch (error) {
      console.error("Error merging user:", error);
    } finally {
      setIsMerging(false);
    }
  };

  const handleClose = () => {
    setSelectedTargetUserId("");
    setSearchTerm("");
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
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 統合元ユーザー表示 */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium text-amber-800 mb-2">統合元ユーザー</h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{user?.name}</p>
                  {user?.phone && <p className="text-sm text-muted-foreground">{user.phone}</p>}
                </div>
                <Badge variant="outline">ゲスト</Badge>
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
          <div className="space-y-3">
            <Label>統合先ユーザー選択</Label>
            <div className="max-h-60 overflow-y-auto border rounded-md">
              {targetUsers.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {searchTerm ? '該当する会員が見つかりません' : '検索してください'}
                </div>
              ) : (
                <RadioGroup value={selectedTargetUserId} onValueChange={setSelectedTargetUserId}>
                  {targetUsers.map((targetUser) => (
                    <div key={targetUser.user_id} className="flex items-center space-x-3 p-3 hover:bg-muted/50 border-b last:border-b-0">
                      <RadioGroupItem value={targetUser.user_id} id={targetUser.user_id} />
                      <label htmlFor={targetUser.user_id} className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-medium">{targetUser.name}</p>
                          {targetUser.phone && (
                            <p className="text-sm text-muted-foreground">{targetUser.phone}</p>
                          )}
                        </div>
                      </label>
                      <Badge>会員</Badge>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
          </div>

          {/* 統合プレビュー */}
          {selectedTargetUser && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-3">統合プレビュー</h4>
                
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <div className="text-center">
                    <p className="font-medium">{user?.name}</p>
                    <Badge variant="outline" className="mt-1">ゲスト</Badge>
                  </div>
                  
                  <ArrowRight className="h-4 w-4 text-blue-600" />
                  
                  <div className="text-center">
                    <p className="font-medium">{selectedTargetUser.name}</p>
                    <Badge className="mt-1">会員</Badge>
                  </div>
                </div>

                <Separator className="my-3" />
                
                <div className="space-y-2 text-sm text-blue-700">
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
            <Button
              type="submit"
              disabled={isMerging || !selectedTargetUserId}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isMerging ? "統合中..." : "統合実行"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};