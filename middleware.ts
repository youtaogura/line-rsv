import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // 管理者ページ・APIへのアクセス制御
    if (
      (req.nextUrl.pathname.startsWith('/api/admin') ||
        req.nextUrl.pathname.startsWith('/admin')) &&
      !req.nextUrl.pathname.startsWith('/admin/login')
    ) {
      // セッションが存在しない場合はログインページにリダイレクト
      if (!req.nextauth.token) {
        return Response.redirect(new URL('/admin/login', req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // /admin/login は認証なしでアクセス可能
        if (req.nextUrl.pathname === '/admin/login') {
          return true;
        }

        // その他の管理者ページは認証が必要
        if (
          req.nextUrl.pathname.startsWith('/admin') ||
          req.nextUrl.pathname.startsWith('/api/admin')
        ) {
          // トークンが存在し、かつ有効期限内かチェック
          if (!token) {
            return false;
          }

          // JWTの有効期限をチェック
          const currentTime = Math.floor(Date.now() / 1000);
          if (
            token.exp &&
            typeof token.exp === 'number' &&
            token.exp < currentTime
          ) {
            return false;
          }

          return true;
        }

        // 管理者ページ以外は制限なし
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/admin/:path*'],
};
