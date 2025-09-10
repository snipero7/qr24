import { prisma } from "@/server/db";
import { requireAuth } from "@/server/auth";
import { toCsv } from "@/server/csv";

export async function GET(req: Request) {
  const auth = await requireAuth(["ADMIN","CLERK"]);
  if (!auth.ok) return Response.json({ code: "UNAUTHORIZED", message: auth.message }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? searchParams.get("query") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  const where: any = {};
  if (status) where.status = status;
  if (q) where.OR = [{ code: { contains: q, mode: "insensitive" } }, { customer: { is: { phone: { contains: q } } } }];

  const items = await prisma.order.findMany({
    where,
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });

  const rows = items.map(o => ({
    id: o.id,
    code: o.code,
    status: o.status,
    customer: o.customer.name,
    phone: o.customer.phone,
    service: o.service,
    deviceModel: o.deviceModel ?? "",
    originalPrice: Number(o.originalPrice),
    collectedPrice: o.collectedPrice ? Number(o.collectedPrice) : "",
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    collectedAt: o.collectedAt ? o.collectedAt.toISOString() : "",
  }));

  const csv = toCsv(rows, [
    "id","code","status","customer","phone","service","deviceModel","originalPrice","collectedPrice","createdAt","updatedAt","collectedAt",
  ]);

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename=orders.csv`,
    },
  });
}

