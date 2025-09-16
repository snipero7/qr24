import { maybeRunScheduledBackup } from "@/server/backup";

export async function GET() {
  try {
    const res = await maybeRunScheduledBackup(new Date());
    return Response.json(res);
  } catch (e: any) {
    return Response.json({ code: "CRON_ERROR", message: e?.message || "failed" }, { status: 500 });
  }
}

