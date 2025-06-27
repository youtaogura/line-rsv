import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = request.cookies.get("line_state")?.value;

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/?error=invalid_state`,
    );
  }

  try {
    const tokenResponse = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/line/callback`,
        client_id: process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID!,
        client_secret: process.env.LINE_LOGIN_CHANNEL_SECRET!,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?error=token_error`,
      );
    }

    const profileResponse = await fetch("https://api.line.me/v2/profile", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const profile = await profileResponse.json();

    const response = NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/reserve`,
    );
    response.cookies.set(
      "line_user",
      JSON.stringify({
        user_id: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
      }),
      {
        httpOnly: true,
        maxAge: 86400,
        sameSite: "lax",
      },
    );
    response.cookies.delete("line_state");

    return response;
  } catch (error) {
    console.error("LINE auth error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/?error=auth_failed`,
    );
  }
}
