import React, { useState, useEffect } from "react";
import type { StaffMember } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Clock } from "lucide-react";
import { StaffMemberBusinessHourManager } from "./StaffMemberBusinessHourManager";

interface StaffEditModalProps {
  isOpen: boolean;
  staffMember: StaffMember | null;
  onClose: () => void;
  onUpdateStaffMember: (id: string, name: string) => Promise<boolean>;
}

export const StaffEditModal: React.FC<StaffEditModalProps> = ({
  isOpen,
  staffMember,
  onClose,
  onUpdateStaffMember,
}) => {
  const [activeTab, setActiveTab] = useState("info");
  const [staffName, setStaffName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (staffMember) {
      setStaffName(staffMember.name);
    }
    // Reset to info tab when modal opens
    setActiveTab("info");
  }, [staffMember]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffMember || !staffName.trim()) return;

    setIsUpdating(true);
    try {
      const success = await onUpdateStaffMember(staffMember.id, staffName.trim());
      if (success) {
        // Keep modal open but show success feedback
        console.log("Staff member updated successfully");
      }
    } catch (error) {
      console.error("Error updating staff member:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setStaffName("");
    setActiveTab("info");
    onClose();
  };

  if (!staffMember) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>{staffMember.name}の設定</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>基本情報</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>対応時間設定</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">基本情報</CardTitle>
              </CardHeader>
              <CardContent>
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

                  <div className="space-y-2">
                    <Label>作成日時</Label>
                    <div className="text-sm text-muted-foreground">
                      {new Date(staffMember.created_at).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                    >
                      閉じる
                    </Button>
                    <Button
                      type="submit"
                      disabled={isUpdating || !staffName.trim() || staffName === staffMember.name}
                    >
                      {isUpdating ? "更新中..." : "更新"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">対応時間設定</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {staffMember.name}の対応可能時間を設定できます
                </p>
              </CardHeader>
              <CardContent>
                <StaffMemberBusinessHourManager
                  staffMember={staffMember}
                  onClose={() => {}} // Don't close the entire modal, just stay on this tab
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};