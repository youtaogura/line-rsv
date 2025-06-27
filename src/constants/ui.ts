export const UI_TEXT = {
  // Common
  LOADING: '読み込み中...',
  ERROR: 'エラーが発生しました',
  SAVE: '保存',
  CANCEL: 'キャンセル',
  DELETE: '削除',
  EDIT: '編集',
  CLOSE: '閉じる',
  
  // Member types
  MEMBER: '会員',
  GUEST: 'ゲスト',
  
  // Admin
  ADMIN_DASHBOARD: '管理画面ダッシュボード',
  BACK_TO_ADMIN: '管理画面に戻る',
  LOGOUT: 'ログアウト',
  AUTHENTICATION_REQUIRED: '認証が必要です',
  AUTHENTICATION_CHECKING: '認証確認中...',
  ADMIN_LOGIN_REQUIRED: '管理者としてログインしてください',
  
  // Reservations
  RESERVATION_MANAGEMENT: '予約管理',
  RESERVATION_CONFIRM_DELETE: '予約の確認・削除・エクスポート',
  RECENT_RESERVATIONS: '最近の予約',
  NO_RESERVATIONS: '予約がありません',
  VIEW_ALL_RESERVATIONS: 'すべての予約を見る →',
  
  // Business hours
  BUSINESS_HOURS_MANAGEMENT: '営業時間管理',
  BUSINESS_HOURS_SETTINGS: '営業時間の設定・変更',
  
  // Users
  USER_MANAGEMENT: 'ユーザー管理',
  USER_INFO_MANAGEMENT: '会員情報の編集・管理',
  NO_USERS: '登録ユーザーがいません',
  
  // System
  SYSTEM_ACCESS_DESCRIPTION: 'システムの各機能にアクセスできます',
  LOGGED_IN_AS: 'ログイン中',
  TENANT: 'テナント',
} as const;