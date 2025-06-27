# ゴルフレッスンスタジオ向けLINE予約システム

LINE公式アカウントと連携したゴルフレッスンの予約システムです。

## 主な機能

- LINEログインによる認証
- 会員/ゲストの識別
- 予約フォーム
- 管理画面（予約一覧・エクスポート）
- LINE Notify通知

## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabaseプロジェクトの設定

1. [Supabase](https://supabase.com/)でプロジェクトを作成
2. `supabase-schema.sql`を実行してテーブルを作成
   - SQL Editor > New Query で実行
3. 環境変数に設定するURLとAPIキーを取得

### 3. LINE Loginの設定

1. [LINE Developers](https://developers.line.biz/)でプロバイダーとチャンネルを作成
2. Callback URLを設定: `http://localhost:3000/api/auth/line/callback`
3. Channel IDとChannel Secretを取得

### 4. LINE Notifyの設定（任意）

1. [LINE Notify](https://notify-bot.line.me/)でトークンを取得
2. 通知を受け取りたいグループ/個人にLINE Notifyを追加

### 5. 環境変数の設定

`.env.local`ファイルを以下の内容で作成：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# LINE Login
NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID=your_line_channel_id
LINE_LOGIN_CHANNEL_SECRET=your_line_channel_secret

# LINE Notify
LINE_NOTIFY_TOKEN=your_line_notify_token

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### 6. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアクセス可能

## ファイル構成

```
src/
├── app/
│   ├── api/
│   │   ├── auth/line/          # LINE認証API
│   │   ├── user/               # ユーザー情報API
│   │   └── notify/             # 通知API
│   ├── login/                  # ログインページ
│   ├── reserve/                # 予約フォーム
│   ├── admin/                  # 管理画面
│   └── page.tsx                # トップページ
└── lib/
    └── supabase.ts             # Supabase設定

supabase-schema.sql             # データベーススキーマ
```

## データベース構造

### users テーブル

- userId (LINE UID、主キー)
- name (名前)
- phone (電話番号、任意)
- memberType ('regular'/'guest')
- createdAt (作成日時)

### reservations テーブル

- id (UUID、主キー)
- userId (LINE UID)
- name (名前)
- datetime (予約日時)
- note (備考、任意)
- memberType ('regular'/'guest')
- createdAt (作成日時)

### available_slots テーブル

- datetime (予約可能日時、主キー)
- isBooked (予約済みフラグ)

## 管理画面

- URL: `/admin`
- パスワード: `admin123`（本番環境では変更してください）
- 機能: 予約一覧表示、JSON/CSV出力

## デプロイ

Vercelでのデプロイを推奨：

1. GitHubにプッシュ
2. Vercelでプロジェクトをインポート
3. 環境変数を設定
4. LINE LoginのCallback URLを本番URLに更新

## 注意事項

- 本番環境では管理画面のパスワードを変更してください
- HTTPS必須（LINEログインの要件）
- 予約可能時間は手動でデータベースに追加する必要があります
