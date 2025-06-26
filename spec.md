
MVP仕様書：ゴルフレッスンスタジオ向けLINE予約システム

概要

個人経営のゴルフレッスンスタジオにおいて、LINEを入り口とした予約受付システムを構築する。
ユーザーはLINE公式アカウントから予約画面にアクセスし、LINEログインを通じて本人識別を行う。既存会員は名前入力なしで予約可能とし、未登録ユーザーはゲストとして予約を受け付ける。

主な要件

- LINE公式アカウントと連携する（入口として使う）
- LINEログイン（OAuth）でユーザーを識別（userId 取得）
- Supabase または Firestore を使ってユーザー情報と予約情報を保存
- 登録済みユーザーは名前の入力不要、未登録ユーザーは入力が必要
- 予約後のデータ保存およびLINEへの自動通知機能（LINE NotifyまたはWebhook）

画面・処理仕様

1. /login：LINEログイン用エンドポイント
- LINEのOAuth認証を使用
- 認証後、以下の情報を取得しセッションに保存
  - userId（LINE UID）
  - displayName
  - pictureUrl
- ログイン成功後、予約ページにリダイレクト（/reserve）

2. /reserve：予約フォーム画面

機能：
- LINEログイン済みであることが前提
- Supabase の users テーブルから userId を検索し、会員かどうか判定
  - 登録済み会員：
    - name 表示のみ
    - フォーム入力項目：日時選択・メッセージ（任意）
  - ゲスト（未登録）：
    - 入力項目：名前、電話番号、日時選択、メッセージ（任意）

予約時の入力項目（POST）：

| フィールド名     | 型        | 説明                           |
|------------------|-----------|--------------------------------|
| userId           | string    | LINEアカウントの一意ID         |
| name             | string    | 会員：DBから取得／ゲスト：入力 |
| phone (任意)     | string    | ゲストユーザーのみ入力         |
| datetime         | string    | ISO形式の予約日時（選択）      |
| note (任意)      | string    | 任意メモ（初回です等）         |

バリデーション：
- datetime は空き時間リストに存在するもののみ許容
- name はゲストの場合必須
- 重複予約は不可（userId + datetime の一意制約）

3. /admin：予約一覧管理画面（簡易）

表示内容：
- 予約日時順の一覧テーブル
  - 名前
  - 会員 or ゲスト
  - 予約日時
  - 備考（note）

管理機能：
- JSON or スプレッドシート形式でエクスポート（任意）
- 認証（簡易管理者パスワード or IP制限でも可）

データベース構造（例：Supabase）

users テーブル（会員情報）

type User = {
  userId: string;        // LINE UID（主キー）
  name: string;
  phone?: string;
  memberType: 'regular' | 'guest';
  createdAt: string;
}

reservations テーブル（予約情報）

type Reservation = {
  id: string;             // UUID
  userId: string;
  name: string;
  datetime: string;       // ISO文字列
  note?: string;
  memberType: 'regular' | 'guest';
  createdAt: string;
}

available_slots テーブル（予約可能時間）

type AvailableSlot = {
  datetime: string;        // ISO形式
  isBooked: boolean;
}

予約フロー

1. ユーザーがLINEから /login にアクセス
2. LINEログインで userId を取得
3. users テーブルで userId を検索
    - 見つかれば「登録済会員」として予約フォームを表示
    - 見つからなければゲスト入力フォームを表示
4. 予約情報を reservations に保存、該当日時を available_slots から削除 or isBooked=true
5. LINE Notify API を使ってオーナーに予約通知（任意）

通知仕様（任意実装）

- 予約が完了したら、LINE Notify経由でオーナーのLINEアカウントに以下の内容を通知：

新規予約が入りました！

名前: 山田太郎（会員）
日時: 2025/07/01 10:00
メモ: 初回レッスンです

技術スタック（例）

| 項目          | 推奨ツール                          |
|---------------|-------------------------------------|
| フロントエンド | Next.js / React                     |
| 認証           | LINE Login SDK                      |
| データベース   | Supabase または Firebase            |
| 通知           | LINE Notify API                     |
| デプロイ       | Vercel または Cloudflare Pages       |

備考・将来的な拡張余地

- カルテ機能（予約ごとの記録、メモなど）
- 自動キャンセル機能（前日までキャンセル可能など）
- 有料会員区分による予約枠優先
- Googleカレンダー連携（空き枠管理との二重化）
