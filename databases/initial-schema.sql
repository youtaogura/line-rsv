-- tenants テーブル（テナント管理）
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- users テーブル（会員情報）
CREATE TABLE users (
    user_id TEXT NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    member_type TEXT CHECK (
        member_type IN ('regular', 'guest')
    ) NOT NULL DEFAULT 'guest',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (tenant_id, user_id)
);

-- reservations テーブル（予約情報）
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    tenant_id UUID NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    note TEXT,
    member_type TEXT CHECK (
        member_type IN ('regular', 'guest')
    ) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (tenant_id, user_id) REFERENCES users (tenant_id, user_id),
    UNIQUE (tenant_id, user_id, datetime)
);

-- business_hours テーブル（曜日+時間帯の営業時間管理）
CREATE TABLE business_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    tenant_id UUID NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (
        day_of_week >= 0
        AND day_of_week <= 6
    ), -- 0=日曜日, 1=月曜日, ..., 6=土曜日
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (
        tenant_id,
        day_of_week,
        start_time,
        end_time
    )
);

-- インデックス
CREATE INDEX idx_tenants_is_active ON tenants (is_active);

CREATE INDEX idx_users_tenant_id ON users (tenant_id);

CREATE INDEX idx_reservations_tenant_datetime ON reservations (tenant_id, datetime);

CREATE INDEX idx_reservations_tenant_user ON reservations (tenant_id, user_id);

CREATE INDEX idx_business_hours_tenant_day ON business_hours (tenant_id, day_of_week);

-- インデックス（business_hoursの追加インデックス）
CREATE INDEX idx_business_hours_active ON business_hours (is_active);