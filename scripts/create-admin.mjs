#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// 環境変数の設定
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required'
  );
  console.error('Please check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdmin() {
  console.log('🔧 Admin Creation Tool\n');

  // コマンドライン引数から値を取得
  const args = process.argv.slice(2);

  if (args.length < 4) {
    console.log(
      'Usage: node scripts/create-admin.js <tenant_id> <username> <password> <name>'
    );
    console.log('');
    console.log('Example:');
    console.log(
      '  node scripts/create-admin.js "550e8400-e29b-41d4-a716-446655440000" "admin" "password123" "管理者"'
    );
    console.log('');
    console.log('Parameters:');
    console.log(
      '  tenant_id: UUID of the tenant (must exist in tenants table)'
    );
    console.log('  username:  Unique username for admin login');
    console.log('  password:  Password for admin login');
    console.log('  name:      Display name for the admin');
    process.exit(1);
  }

  const [tenantId, username, password, name] = args;

  // 入力値の検証
  console.log('📋 Validating input...');

  // UUIDの基本的な形式チェック
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(tenantId)) {
    console.error('❌ Error: tenant_id must be a valid UUID format');
    process.exit(1);
  }

  // ユーザー名の長さチェック
  if (username.length < 3 || username.length > 50) {
    console.error('❌ Error: username must be between 3 and 50 characters');
    process.exit(1);
  }

  // パスワードの強度チェック
  if (password.length < 6) {
    console.error('❌ Error: password must be at least 6 characters long');
    process.exit(1);
  }

  try {
    // テナントの存在確認
    console.log('🔍 Checking if tenant exists...');
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      console.error('❌ Error: Tenant not found. Please check the tenant_id.');
      console.error('Available tenants:');

      const { data: tenants } = await supabase
        .from('tenants')
        .select('id, name')
        .limit(10);

      if (tenants && tenants.length > 0) {
        tenants.forEach((t) => {
          console.log(`  - ${t.id} (${t.name})`);
        });
      } else {
        console.log('  No tenants found in database');
      }
      process.exit(1);
    }

    console.log(`✅ Tenant found: ${tenant.name} (${tenant.id})`);

    // 既存のユーザー名チェック
    console.log('🔍 Checking if username already exists...');
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('username')
      .eq('username', username)
      .single();

    if (existingAdmin) {
      console.error(`❌ Error: Username '${username}' already exists`);
      process.exit(1);
    }

    console.log(`✅ Username '${username}' is available`);

    // パスワードをハッシュ化
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 12);

    // 管理者をデータベースに追加
    console.log('💾 Creating admin user...');
    const { data, error } = await supabase
      .from('admins')
      .insert({
        tenant_id: tenantId,
        username: username,
        password_hash: passwordHash,
        name: name,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating admin:', error.message);
      process.exit(1);
    }

    console.log('\n🎉 Admin created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 Admin Details:`);
    console.log(`   ID:         ${data.id}`);
    console.log(`   Tenant:     ${tenant.name} (${data.tenant_id})`);
    console.log(`   Username:   ${data.username}`);
    console.log(`   Name:       ${data.name}`);
    console.log(`   Created:    ${new Date(data.created_at).toLocaleString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔑 Login Information:');
    console.log(`   URL:        /admin/login`);
    console.log(`   Username:   ${username}`);
    console.log(`   Password:   ${password}`);
    console.log(
      '\n⚠️  Please store the password securely and consider changing it after first login.'
    );
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみ実行
if (import.meta.url === `file://${process.argv[1]}`) {
  createAdmin();
}

export { createAdmin };
