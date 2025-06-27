-- 既存テナントにデフォルトメニューを作成するSQL
-- 実行前に、実際のテナントIDを確認してから実行してください

-- デフォルトメニューを各テナントに作成
INSERT INTO reservation_menu (tenant_id, name, duration_minutes, start_minutes_options)
SELECT 
    id as tenant_id,
    'デフォルトメニュー' as name,
    30 as duration_minutes,
    ARRAY[0, 30] as start_minutes_options
FROM tenants 
WHERE is_active = true
AND id NOT IN (
    -- 既にメニューが存在するテナントは除外
    SELECT DISTINCT tenant_id FROM reservation_menu
);

-- 既存の予約データをデフォルトメニューに紐付け
-- 注意: この処理は既存予約が存在する場合のみ実行
UPDATE reservations 
SET 
    reservation_menu_id = (
        SELECT rm.id 
        FROM reservation_menu rm 
        WHERE rm.tenant_id = reservations.tenant_id 
        AND rm.name = 'デフォルトメニュー'
        LIMIT 1
    ),
    duration_minutes = 30
WHERE reservation_menu_id IS NULL
AND duration_minutes IS NULL;

-- 確認用クエリ（実行後の状態確認）
-- SELECT 
--     t.name as tenant_name,
--     rm.name as menu_name,
--     rm.duration_minutes,
--     rm.start_minutes_options,
--     COUNT(r.id) as reservation_count
-- FROM tenants t
-- LEFT JOIN reservation_menu rm ON t.id = rm.tenant_id
-- LEFT JOIN reservations r ON rm.id = r.reservation_menu_id
-- WHERE t.is_active = true
-- GROUP BY t.id, t.name, rm.id, rm.name, rm.duration_minutes, rm.start_minutes_options
-- ORDER BY t.name;