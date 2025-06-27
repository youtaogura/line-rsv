#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// 環境変数の設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "❌ Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables are required",
  );
  console.error("Please check your .env.local file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function deleteAdmin() {
  console.log("🗑️  Admin Deletion Tool\n");

  // コマンドライン引数から値を取得
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log("Usage: node scripts/delete-admin.js <username>");
    console.log("");
    console.log("Example:");
    console.log("  node scripts/delete-admin.js admin");
    console.log("");
    console.log("Parameters:");
    console.log("  username: Username of the admin to delete");
    process.exit(1);
  }

  const [username] = args;

  try {
    // 管理者の存在確認
    console.log(`🔍 Looking for admin user: ${username}`);
    const { data: admin, error: fetchError } = await supabase
      .from("admins")
      .select(
        `
        id,
        username,
        name,
        tenants!inner(id, name)
      `,
      )
      .eq("username", username)
      .single();

    if (fetchError || !admin) {
      console.error(`❌ Error: Admin user '${username}' not found`);

      // 利用可能なユーザー名を表示
      const { data: availableAdmins } = await supabase
        .from("admins")
        .select("username, name")
        .limit(10);

      if (availableAdmins && availableAdmins.length > 0) {
        console.log("\nAvailable admin users:");
        availableAdmins.forEach((a) => {
          console.log(`  - ${a.username} (${a.name})`);
        });
      }
      process.exit(1);
    }

    console.log(`✅ Found admin: ${admin.name} (@${admin.username})`);
    console.log(`   Tenant: ${admin.tenants.name} (${admin.tenants.id})`);

    // 確認プロンプト（本来はreadline-syncなどを使用）
    console.log("\n⚠️  WARNING: This action cannot be undone!");
    console.log(`Are you sure you want to delete admin user '${username}'?`);
    console.log('Type "yes" to confirm, or anything else to cancel:');

    // 簡単な確認（実際の使用では readline-sync を推奨）
    const confirmEnv = process.env.CONFIRM_DELETE;
    if (confirmEnv !== "yes") {
      console.log(
        "❌ Deletion cancelled. Set CONFIRM_DELETE=yes environment variable to confirm deletion.",
      );
      console.log(
        "Example: CONFIRM_DELETE=yes node scripts/delete-admin.js admin",
      );
      process.exit(1);
    }

    // 管理者を削除
    console.log("🗑️  Deleting admin user...");
    const { error: deleteError } = await supabase
      .from("admins")
      .delete()
      .eq("id", admin.id);

    if (deleteError) {
      console.error("❌ Error deleting admin:", deleteError.message);
      process.exit(1);
    }

    console.log("\n✅ Admin user deleted successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🗑️  Deleted Admin Details:");
    console.log(`   Username: ${admin.username}`);
    console.log(`   Name:     ${admin.name}`);
    console.log(`   Tenant:   ${admin.tenants.name}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } catch (error) {
    console.error("❌ Unexpected error:", error.message);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみ実行
if (import.meta.url === `file://${process.argv[1]}`) {
  deleteAdmin();
}

export { deleteAdmin };
