#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config({ path: '.env.local' });

// 環境変数の設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '❌ Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables are required'
  );
  console.error('Please check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// readline インターフェース作成
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// プロンプト表示とユーザー入力取得
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function getUserInput() {
  console.log('🏢 Tenant Creation Wizard');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let tenantName, adminUsername, adminPassword, adminName, adminEmail;

  // 1. テナント名の入力
  while (true) {
    tenantName = await askQuestion('📝 Enter tenant name (1-100 characters): ');
    if (tenantName.length >= 1 && tenantName.length <= 100) {
      break;
    }
    console.log(
      '❌ Tenant name must be between 1 and 100 characters. Please try again.\n'
    );
  }

  // 2. 管理者ユーザー名の入力
  while (true) {
    adminUsername = await askQuestion(
      '👤 Enter admin username (3-50 characters): '
    );
    if (adminUsername.length >= 3 && adminUsername.length <= 50) {
      // 既存のユーザー名チェック
      console.log('🔍 Checking if username is available...');
      const { data: existingAdmin } = await supabase
        .from('admins')
        .select('username')
        .eq('username', adminUsername)
        .single();

      if (existingAdmin) {
        console.log(
          `❌ Username '${adminUsername}' already exists. Please choose a different username.\n`
        );
        continue;
      }
      console.log(`✅ Username '${adminUsername}' is available\n`);
      break;
    }
    console.log(
      '❌ Username must be between 3 and 50 characters. Please try again.\n'
    );
  }

  // 3. 管理者パスワードの入力
  while (true) {
    adminPassword = await askQuestion(
      '🔐 Enter admin password (min 6 characters): '
    );
    if (adminPassword.length >= 6) {
      const confirmPassword = await askQuestion('🔐 Confirm admin password: ');
      if (adminPassword === confirmPassword) {
        console.log('✅ Password confirmed\n');
        break;
      }
      console.log('❌ Passwords do not match. Please try again.\n');
    } else {
      console.log(
        '❌ Password must be at least 6 characters long. Please try again.\n'
      );
    }
  }

  // 4. 管理者表示名の入力
  while (true) {
    adminName = await askQuestion(
      '📋 Enter admin display name (1-100 characters): '
    );
    if (adminName.length >= 1 && adminName.length <= 100) {
      break;
    }
    console.log(
      '❌ Admin name must be between 1 and 100 characters. Please try again.\n'
    );
  }

  // 5. 管理者メールアドレスの入力
  while (true) {
    adminEmail = await askQuestion('📧 Enter admin email address: ');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(adminEmail)) {
      break;
    }
    console.log('❌ Please enter a valid email address. Please try again.\n');
  }

  return { tenantName, adminUsername, adminPassword, adminName, adminEmail };
}

async function createTenant() {
  try {
    const { tenantName, adminUsername, adminPassword, adminName, adminEmail } =
      await getUserInput();

    // 確認画面を表示
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Please confirm the following information:');
    console.log(`   Tenant Name:      ${tenantName}`);
    console.log(`   Admin Username:   ${adminUsername}`);
    console.log(`   Admin Name:       ${adminName}`);
    console.log(`   Admin Email:      ${adminEmail}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const confirm = await askQuestion(
      'Do you want to create this tenant? (y/N): '
    );
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled.');
      rl.close();
      process.exit(0);
    }

    // 1. テナントを作成
    console.log('🏢 Creating tenant...');
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: tenantName,
        is_active: true,
      })
      .select()
      .single();

    if (tenantError) {
      console.error('❌ Error creating tenant:', tenantError.message);
      process.exit(1);
    }

    console.log(`✅ Tenant created: ${tenant.name} (${tenant.id})`);

    // 2. パスワードをハッシュ化
    console.log('🔐 Hashing admin password...');
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    // 3. 管理者を作成
    console.log('👤 Creating admin user...');
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .insert({
        tenant_id: tenant.id,
        username: adminUsername,
        password_hash: passwordHash,
        name: adminName,
        email: adminEmail,
      })
      .select()
      .single();

    if (adminError) {
      console.error('❌ Error creating admin:', adminError.message);
      // テナント削除（ロールバック）
      await supabase.from('tenants').delete().eq('id', tenant.id);
      process.exit(1);
    }

    console.log(`✅ Admin created: ${admin.name} (${admin.username})`);

    // 4. デフォルト予約メニューを作成
    console.log('📋 Creating default reservation menu...');
    const { data: menu, error: menuError } = await supabase
      .from('reservation_menu')
      .insert({
        tenant_id: tenant.id,
        name: 'デフォルトメニュー',
        duration_minutes: 30,
        start_minutes_options: [0, 30],
      })
      .select()
      .single();

    if (menuError) {
      console.error('❌ Error creating reservation menu:', menuError.message);
      // テナントと管理者を削除（ロールバック）
      await supabase.from('tenants').delete().eq('id', tenant.id);
      process.exit(1);
    }

    console.log(
      `✅ Default menu created: ${menu.name} (${menu.duration_minutes} minutes)`
    );

    // 5. デフォルトスタッフを作成
    console.log('👥 Creating default staff...');
    const { data: staff, error: staffError } = await supabase
      .from('staff_members')
      .insert({
        tenant_id: tenant.id,
        name: adminName,
      })
      .select()
      .single();

    if (staffError) {
      console.error('❌ Error creating default staff:', staffError.message);
      // テナント、管理者、メニューを削除（ロールバック）
      await supabase.from('tenants').delete().eq('id', tenant.id);
      process.exit(1);
    }

    console.log(`✅ Default staff created: ${staff.name}`);

    console.log('\n🎉 Tenant setup completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🏢 Tenant Information:`);
    console.log(`   ID:         ${tenant.id}`);
    console.log(`   Name:       ${tenant.name}`);
    console.log(`   Active:     ${tenant.is_active}`);
    console.log(
      `   Created:    ${new Date(tenant.created_at).toLocaleString()}`
    );
    console.log('');
    console.log(`👤 Admin Information:`);
    console.log(`   ID:         ${admin.id}`);
    console.log(`   Username:   ${admin.username}`);
    console.log(`   Name:       ${admin.name}`);
    console.log(`   Email:      ${admin.email}`);
    console.log(
      `   Created:    ${new Date(admin.created_at).toLocaleString()}`
    );
    console.log('');
    console.log(`📋 Default Menu Information:`);
    console.log(`   ID:         ${menu.id}`);
    console.log(`   Name:       ${menu.name}`);
    console.log(`   Duration:   ${menu.duration_minutes} minutes`);
    console.log(
      `   Slots:      ${menu.start_minutes_options.join(', ')} minutes past hour`
    );
    console.log('');
    console.log(`👥 Default Staff Information:`);
    console.log(`   ID:         ${staff.id}`);
    console.log(`   Name:       ${staff.name}`);
    console.log(
      `   Created:    ${new Date(staff.created_at).toLocaleString()}`
    );
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔑 Login Information:');
    console.log(`   URL:        /admin/login`);
    console.log(`   Username:   ${adminUsername}`);
    console.log(`   Password:   ${adminPassword}`);
    console.log(
      '\n⚠️  Please store the password securely and consider changing it after first login.'
    );
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// スクリプトが直接実行された場合のみ実行
if (import.meta.url === `file://${process.argv[1]}`) {
  createTenant();
}

export { createTenant };
