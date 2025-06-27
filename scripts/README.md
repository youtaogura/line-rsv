# Admin Management Scripts

このディレクトリには管理者アカウントを管理するためのスクリプトが含まれています。

## 前提条件

1. `.env.local`ファイルが設定されていること
2. Supabaseデータベースに`admins`テーブルが作成されていること
3. `tenants`テーブルにテナントデータが存在すること

## スクリプト一覧

### 📋 管理者一覧表示

```bash
npm run admin:list
# または
node scripts/list-admins.mjs
```

現在登録されている全ての管理者ユーザーを表示します。

### 👤 管理者作成

```bash
npm run admin:create <tenant_id> <username> <password> <name>
# または
node scripts/create-admin.mjs <tenant_id> <username> <password> <name>
```

新しい管理者ユーザーを作成します。

**パラメータ:**
- `tenant_id`: テナントのUUID（tenantsテーブルに存在する必要があります）
- `username`: ログイン用のユーザー名（3-50文字、一意である必要があります）
- `password`: ログイン用のパスワード（6文字以上）
- `name`: 管理者の表示名

**例:**
```bash
npm run admin:create "550e8400-e29b-41d4-a716-446655440000" "admin" "securePassword123" "システム管理者"
# または
node scripts/create-admin.mjs "550e8400-e29b-41d4-a716-446655440000" "admin" "securePassword123" "システム管理者"
```

### 🗑️ 管理者削除

```bash
CONFIRM_DELETE=yes npm run admin:delete <username>
# または
CONFIRM_DELETE=yes node scripts/delete-admin.mjs <username>
```

指定したユーザー名の管理者を削除します。

**パラメータ:**
- `username`: 削除する管理者のユーザー名

**例:**
```bash
CONFIRM_DELETE=yes npm run admin:delete admin
# または
CONFIRM_DELETE=yes node scripts/delete-admin.mjs admin
```

⚠️ **注意**: 削除は取り消しできません。`CONFIRM_DELETE=yes`環境変数が必要です。

## 使用例

### 1. 既存の管理者を確認
```bash
npm run admin:list
```

### 2. 新しい管理者を作成
```bash
# 管理者を作成
npm run admin:create "your-tenant-id" "admin" "password123" "管理者"
```

### 3. 管理者でログイン
ブラウザで `/admin/login` にアクセスし、作成したユーザー名とパスワードでログインします。

### 4. 不要な管理者を削除
```bash
CONFIRM_DELETE=yes npm run admin:delete old-admin
```

## トラブルシューティング

### よくあるエラー

**環境変数エラー**
```
❌ Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables are required
```
→ `.env.local`ファイルを確認してください

**テナントが見つからない**
```
❌ Error: Tenant not found. Please check the tenant_id.
```
→ 正しいテナントIDを使用しているか確認してください

**ユーザー名が重複**
```
❌ Error: Username 'admin' already exists
```
→ 異なるユーザー名を使用してください

### デバッグ

スクリプトの詳細な実行ログを確認したい場合:

```bash
DEBUG=true npm run admin:create ...
```

## セキュリティ注意事項

1. **パスワードの強度**: 本番環境では強固なパスワードを使用してください
2. **環境変数の保護**: `.env.local`ファイルをバージョン管理に含めないでください
3. **アクセス制限**: このスクリプトは管理者のみが実行できる環境で使用してください
4. **ログの管理**: 実行ログに機密情報が含まれないよう注意してください