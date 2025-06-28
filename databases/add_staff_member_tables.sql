-- スタッフメンバーテーブル作成
CREATE TABLE staff_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- スタッフメンバーの営業時間テーブル作成
CREATE TABLE staff_member_business_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_member_id UUID NOT NULL REFERENCES staff_members (id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (
        day_of_week >= 0
        AND day_of_week <= 6
    ), -- 0=日曜日, 1=月曜日, ..., 6=土曜日
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (
        staff_member_id,
        day_of_week,
        start_time,
        end_time
    )
);

-- 既存テーブルにstaff_member_idカラムを追加
ALTER TABLE reservations 
ADD COLUMN staff_member_id UUID REFERENCES staff_members (id) ON DELETE SET NULL;

ALTER TABLE business_hours 
ADD COLUMN staff_member_id UUID REFERENCES staff_members (id) ON DELETE SET NULL;

-- インデックス作成
CREATE INDEX idx_staff_members_tenant_id ON staff_members (tenant_id);
CREATE INDEX idx_staff_member_business_hours_staff_member_id ON staff_member_business_hours (staff_member_id);
CREATE INDEX idx_staff_member_business_hours_day_active ON staff_member_business_hours (day_of_week, is_active);
CREATE INDEX idx_reservations_staff_member_id ON reservations (staff_member_id);
CREATE INDEX idx_business_hours_staff_member_id ON business_hours (staff_member_id);

-- 既存の営業時間をデフォルトスタッフに移行するためのトリガー（後で管理者が手動で設定）
-- 注意: 既存データの移行は手動で行う必要があります