import { prisma } from "@/server/db";
import { requireAuth } from "@/server/auth";
import { toCsv } from "@/server/csv";

export async function GET() {
  const auth = await requireAuth(["ADMIN","CLERK"]);
  if (!auth.ok) return Response.json({ code: "UNAUTHORIZED", message: auth.message }, { status: auth.status });

  const rows = await prisma.$queryRaw<{ day: Date; count: number; sum: number }[]>`
    SELECT DATE_TRUNC('day', "collectedAt") AS day,
           COUNT(*) AS count,
           COALESCE(SUM("collectedPrice"), 0) AS sum
    FROM "Order"
    WHERE "collectedAt" IS NOT NULL
      AND "collectedAt" >= NOW() - interval '30 days'
    GROUP BY day
    ORDER BY day DESC
  `;
  const data = rows.map(r => ({ day: r.day.toISOString().slice(0,10), count: Number(r.count), sum: Number(r.sum) }));
  const csv = toCsv(data, ["day","count","sum"]);
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=orders-by-day.csv" } });
}

