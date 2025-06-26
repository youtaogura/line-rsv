-- users テーブル（会員情報）
CREATE TABLE users (
    user_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    member_type TEXT CHECK (member_type IN ('regular', 'guest')) NOT NULL DEFAULT 'guest',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- reservations テーブル（予約情報）
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    note TEXT,
    member_type TEXT CHECK (member_type IN ('regular', 'guest')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, datetime)
);

-- available_slots テーブル（予約可能時間）
CREATE TABLE available_slots (
    datetime TIMESTAMP WITH TIME ZONE PRIMARY KEY,
    is_booked BOOLEAN DEFAULT FALSE
);

-- インデックス
CREATE INDEX idx_reservations_datetime ON reservations(datetime);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_available_slots_datetime ON available_slots(datetime);

-- サンプルの予約可能時間を追加（今後7日間、毎日10:00-18:00の1時間おき）
INSERT INTO available_slots (datetime) 
SELECT 
    generate_series(
        DATE_TRUNC('day', NOW()) + interval '10 hours',
        DATE_TRUNC('day', NOW()) + interval '7 days' + interval '18 hours',
        interval '1 hour'
    ) as datetime
WHERE EXTRACT(hour FROM generate_series(
    DATE_TRUNC('day', NOW()) + interval '10 hours',
    DATE_TRUNC('day', NOW()) + interval '7 days' + interval '18 hours',
    interval '1 hour'
)) BETWEEN 10 AND 17;

-- 開発用ダミーユーザーを追加
INSERT INTO users (user_id, name, phone, member_type) VALUES 
('dev_member_001', '田中太郎', '090-1234-5678', 'regular');

-- 他のダミーデータは自動で作成されるため不要

-- business_hours テーブル（曜日+時間帯の営業時間管理）
CREATE TABLE business_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=日曜日, 1=月曜日, ..., 6=土曜日
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(day_of_week, start_time, end_time)
);

-- インデックス
CREATE INDEX idx_business_hours_day_of_week ON business_hours(day_of_week);
CREATE INDEX idx_business_hours_active ON business_hours(is_active);

-- サンプルの営業時間を追加（月曜日〜土曜日の09:00-18:00）
INSERT INTO business_hours (day_of_week, start_time, end_time, is_active) VALUES 
(1, '09:00', '18:00', true), -- 月曜日
(2, '09:00', '18:00', true), -- 火曜日
(3, '09:00', '18:00', true), -- 水曜日
(4, '09:00', '18:00', true), -- 木曜日
(5, '09:00', '18:00', true), -- 金曜日
(6, '09:00', '18:00', true); -- 土曜日