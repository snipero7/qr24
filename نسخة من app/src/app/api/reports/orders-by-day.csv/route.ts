import { prisma } from "@/server/db";
import { requireAuth } from "@/server/auth";
import { toCsv } from "@/server/csv";

export async function GET(req: Request) {
  const auth = await requireAuth(["ADMIN","CLERK"]);
  if (!auth.ok) return Response.json({ code: "UNAUTHORIZED", message: auth.message }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const toParam = searchParams.get('to') ? new Date(searchParams.get('to') as string) : new Date();
  const fromParam = searchParams.get('from') ? new Date(searchParams.get('from') as string) : new Date(Date.now()-29*24*3600*1000);
  const toDate = new Date(toParam); toDate.setHours(23,59,59,999);
  const fromDate = new Date(fromParam); fromDate.setHours(0,0,0,0);

  const rows = await prisma.$queryRaw<{ day: Date; count: number; sum: number; extra_sum: number; discount_sum: number }[]>`
    SELECT DATE_TRUNC('day', "collectedAt") AS day,
           COUNT(*) AS count,
           COALESCE(SUM("collectedPrice"), 0) AS sum,
           COALESCE(SUM(COALESCE("extraCharge", 0)), 0) AS extra_sum,
           COALESCE(SUM(GREATEST(0, (COALESCE("originalPrice",0) + COALESCE("extraCharge",0) - COALESCE("collectedPrice",0)))), 0) AS discount_sum
    FROM "Order"
    WHERE "collectedAt" IS NOT NULL
      AND "collectedAt" >= ${fromDate}
      AND "collectedAt" <= ${toDate}
    GROUP BY day
    ORDER BY day DESC
  `;
  const data = rows.map(r => ({ day: r.day.toISOString().slice(0,10), count: Number(r.count), sum: Number(r.sum), extra_sum: Number(r.extra_sum), discount_sum: Number(r.discount_sum) }));
  const csv = toCsv(data, ["day","count","sum","extra_sum","discount_sum"]);
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=orders-by-day.csv" } });
}
