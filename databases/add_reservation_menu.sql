-- 予約メニューテーブルの追加
-- 予約メニューを管理するテーブル
CREATE TABLE reservation_menu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,  -- メニュー名（例: "初級クラス"）
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),  -- メニュー所要時間（例: 90）
    start_minutes_options INTEGER[] NOT NULL,  -- 許可する開始分（例: {0, 30}）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- reservations テーブルに新しいカラムを追加
ALTER TABLE reservations 
ADD COLUMN reservation_menu_id UUID REFERENCES reservation_menu(id) ON DELETE SET NULL,
ADD COLUMN duration_minutes INTEGER;

-- インデックスの追加
CREATE INDEX idx_reservation_menu_tenant_id ON reservation_menu(tenant_id);
CREATE INDEX idx_reservations_menu_id ON reservations(reservation_menu_id);

-- 各テナントにデフォルトメニューを作成（既存システムとの互換性のため）
-- 注意: 実際のテナントIDに合わせて手動で実行する必要があります
-- INSERT INTO reservation_menu (tenant_id, name, duration_minutes, start_minutes_options)
-- SELECT id, 'デフォルトメニュー', 30, ARRAY[0, 30]
-- FROM tenants WHERE is_active = true;

-- 既存の予約データをデフォルトメニューに紐付け（オプション）
-- UPDATE reservations 
-- SET reservation_menu_id = (
--     SELECT rm.id 
--     FROM reservation_menu rm 
--     WHERE rm.tenant_id = reservations.tenant_id 
--     AND rm.name = 'デフォルトメニュー'
--     LIMIT 1
-- ),
-- duration_minutes = 30
-- WHERE reservation_menu_id IS NULL;