import { NextRequest } from "next/server";
import { updateSettings } from "@/server/settings";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  if (!code) return Response.json({ code: 'NO_CODE' }, { status: 400 });
  const base = `${url.protocol}//${url.host}`;
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const params = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirect_uri: `${base}/api/gdrive/oauth/callback`,
    grant_type: 'authorization_code',
  });
  try {
    const res = await fetch(tokenUrl, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: params.toString() });
    const data = await res.json() as any;
    if (!res.ok) return Response.json({ code: 'TOKEN_ERROR', message: data?.error || 'token exchange failed' }, { status: 500 });
    await updateSettings({
      gdriveAccessToken: data.access_token,
      gdriveRefreshToken: data.refresh_token,
      gdriveExpiry: data.expires_in ? new Date(Date.now() + Number(data.expires_in) * 1000) : null,
    } as any);
    return Response.redirect('/settings');
  } catch (e: any) {
    return Response.json({ code: 'TOKEN_ERROR', message: e?.message || 'failed' }, { status: 500 });
  }
}

