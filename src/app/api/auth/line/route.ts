import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  const channelId = process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID!;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/line/callback`;
  const state = Math.random().toString(36).substring(7);

  const authUrl = new URL("https://access.line.me/oauth2/v2.1/authorize");
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("client_id", channelId);
  authUrl.searchParams.append("redirect_uri", redirectUri);
  authUrl.searchParams.append("state", state);
  authUrl.searchParams.append("scope", "profile openid");

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set("line_state", state, { httpOnly: true, maxAge: 600 });

  return response;
}
