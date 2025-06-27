import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // 開発環境でのみ利用可能
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Development only" }, { status: 403 });
  }

  try {
    const { userType } = await request.json();

    let userData;
    if (userType === "member") {
      userData = {
        user_id: "dev_member_001",
        displayName: "田中太郎（会員）",
        pictureUrl: null,
      };
    } else {
      userData = {
        user_id: "dev_guest_001",
        displayName: "山田花子（ゲスト）",
        pictureUrl: null,
      };
    }

    const response = NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/reserve`,
    );
    response.cookies.set("line_user", JSON.stringify(userData), {
      httpOnly: true,
      maxAge: 86400,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Dev auth error:", error);
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }
}
