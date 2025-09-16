import { updateSettings } from "@/server/settings";

export async function POST() {
  try {
    await updateSettings({ gdriveAccessToken: null as any, gdriveRefreshToken: null as any, gdriveExpiry: null as any } as any);
    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ code: 'DISCONNECT_FAILED', message: e?.message || 'failed' }, { status: 500 });
  }
}

