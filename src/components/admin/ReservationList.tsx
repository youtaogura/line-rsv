import React from "react";
import type { Reservation } from "@/lib/supabase";
import { MemberTypeBadge, DateTimeDisplay } from "@/components/common";
import { MonthNavigation } from "@/components/admin/MonthNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UI_TEXT } from "@/constants/ui";

interface ReservationWithStaff extends Reservation {
  staff_members?: {
    id: string;
    name: string;
  } | null;
  users?: {
    user_id: string;
    name: string;
  } | null;
}

interface ReservationListProps {
  tenantId: string | null;
  reservations: ReservationWithStaff[];
  onDeleteReservation: (tenantId: string, id: string) => Promise<void>;
  selectedStaffId: string;
  currentMonth: string;
  onMonthChange: (month: string) => void;
}

export const ReservationList: React.FC<ReservationListProps> = ({
  tenantId,
  reservations,
  onDeleteReservation,
  selectedStaffId,
  currentMonth,
  onMonthChange,
}) => {
  const filteredReservations = reservations.filter((reservation) => {
    if (selectedStaffId === "all") {
      return true;
    }
    if (selectedStaffId === "unassigned") {
      return !reservation.staff_member_id;
    }
    return reservation.staff_member_id === selectedStaffId;
  });
  return (
    <div>
      <MonthNavigation 
        currentMonth={currentMonth}
        onMonthChange={onMonthChange}
      />
      
      {/* Card View */}
      <div className="space-y-4">
        {filteredReservations.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              予約がありません
            </CardContent>
          </Card>
        ) : (
          filteredReservations.map((reservation) => (
            <Card key={reservation.id}>
              <CardContent className="p-4 space-y-3">
                {/* ユーザー名と会員種別 */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {reservation.users?.name || "ユーザー名が取得できませんでした"}
                    </h3>
                    <div className="mt-1">
                      <MemberTypeBadge memberType={reservation.member_type} />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!tenantId) throw new Error("テナントIDが見つかりません");
                      onDeleteReservation(tenantId, reservation.id)
                    }}
                    className="text-red-600 hover:text-red-900 hover:bg-red-50 ml-2"
                  >
                    {UI_TEXT.DELETE}
                  </Button>
                </div>

                <Separator />

                {/* 予約情報 */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">予約日時</span>
                    <DateTimeDisplay datetime={reservation.datetime} format="full" />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">担当スタッフ</span>
                    <span className="text-sm">{reservation.staff_members?.name || "未指定"}</span>
                  </div>

                  {reservation.note && (
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-muted-foreground">備考</span>
                      <span className="text-sm text-right flex-1 ml-4">{reservation.note}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">予約作成日時</span>
                    <DateTimeDisplay datetime={reservation.created_at} format="short" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
