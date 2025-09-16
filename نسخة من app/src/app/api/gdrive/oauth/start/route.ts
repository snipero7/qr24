import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const base = `${url.protocol}//${url.host}`;
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  if (!clientId || !clientSecret) {
    return Response.redirect(`${base}/settings?error=gdrive_missing_env`);
  }
  const redirectUri = `${base}/api/gdrive/oauth/callback`;
  const scope = encodeURIComponent('https://www.googleapis.com/auth/drive.file');
  const consent = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&access_type=offline&prompt=consent`;
  return Response.redirect(consent);
}
