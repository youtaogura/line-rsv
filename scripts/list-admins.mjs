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

async function listAdmins() {
  console.log("📋 Admin List\n");

  try {
    // 管理者一覧を取得（テナント情報も含める）
    const { data: admins, error } = await supabase
      .from("admins")
      .select(
        `
        id,
        username,
        name,
        created_at,
        updated_at,
        tenants!inner(id, name)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching admins:", error.message);
      process.exit(1);
    }

    if (!admins || admins.length === 0) {
      console.log("📭 No admin users found");
      console.log("\nTo create an admin user, run:");
      console.log(
        "  node scripts/create-admin.js <tenant_id> <username> <password> <name>",
      );
      return;
    }

    console.log(`Found ${admins.length} admin user(s):\n`);

    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (@${admin.username})`);
      console.log(`   ID:       ${admin.id}`);
      console.log(`   Tenant:   ${admin.tenants.name} (${admin.tenants.id})`);
      console.log(
        `   Created:  ${new Date(admin.created_at).toLocaleString()}`,
      );
      console.log(
        `   Updated:  ${new Date(admin.updated_at).toLocaleString()}`,
      );
      console.log("");
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("💡 Tips:");
    console.log("  • Login at: /admin/login");
    console.log("  • To create a new admin: node scripts/create-admin.js");
    console.log(
      "  • To delete an admin: node scripts/delete-admin.js <username>",
    );
  } catch (error) {
    console.error("❌ Unexpected error:", error.message);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみ実行
if (import.meta.url === `file://${process.argv[1]}`) {
  listAdmins();
}

export { listAdmins };
