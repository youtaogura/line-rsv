import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // APIパスは処理しない
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return;
    }

    // 管理者ページへのアクセス制御
    if (
      req.nextUrl.pathname.startsWith("/admin") &&
      !req.nextUrl.pathname.startsWith("/admin/login")
    ) {
      // セッションが存在しない場合はログインページにリダイレクト
      if (!req.nextauth.token) {
        return Response.redirect(new URL("/admin/login", req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // APIパスは常に許可
        if (req.nextUrl.pathname.startsWith("/api/")) {
          return true;
        }

        // /admin/login は認証なしでアクセス可能
        if (req.nextUrl.pathname === "/admin/login") {
          return true;
        }

        // その他の管理者ページは認証が必要
        if (req.nextUrl.pathname.startsWith("/admin")) {
          return !!token;
        }

        // 管理者ページ以外は制限なし
        return true;
      },
    },
  },
);

export const config = {
  matcher: ["/admin/:path*"],
};
