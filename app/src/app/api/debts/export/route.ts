import { prisma } from "@/server/db";
import { requireAuth } from "@/server/auth";
import { toCsv, toExcelHtml } from "@/server/csv";

export async function GET(req: Request) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.ok) return Response.json({ code: "UNAUTHORIZED", message: auth.message }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const format = (searchParams.get("format") || "csv").toLowerCase();
  const status = searchParams.get("status") ?? undefined;
  const shop = searchParams.get("shop") ?? undefined;
  const createdFrom = searchParams.get("createdFrom") ?? undefined;
  const createdTo = searchParams.get("createdTo") ?? undefined;
  const remainingMin = searchParams.get("remainingMin") ?? undefined;
  const remainingMax = searchParams.get("remainingMax") ?? undefined;

  const where: any = {};
  if (status) where.status = status;
  if (shop) where.shopName = { contains: shop, mode: "insensitive" };
  if (createdFrom || createdTo) {
    where.createdAt = {} as any;
    if (createdFrom) where.createdAt.gte = new Date(createdFrom);
    if (createdTo) { const d = new Date(createdTo); d.setHours(23,59,59,999); where.createdAt.lte = d; }
  }

  const debts = await prisma.debt.findMany({
    where,
    include: { payments: true },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const rows = debts.map((d) => {
    const paid = d.payments.reduce((s, p) => s + Number(p.amount), 0);
    const remaining = Math.max(0, Number(d.amount) - paid);
    return {
      id: d.id,
      shopName: d.shopName,
      phone: d.phone ?? "",
      service: d.service,
      amount: Number(d.amount),
      paid,
      remaining,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
    };
  }).filter((row) => {
    const min = remainingMin ? Number(remainingMin) : undefined;
    const max = remainingMax ? Number(remainingMax) : undefined;
    if (min !== undefined && !isNaN(min) && row.remaining < min) return false;
    if (max !== undefined && !isNaN(max) && row.remaining > max) return false;
    return true;
  });

  const columns = [
    { key: "id", label: "المعرف" },
    { key: "shopName", label: "الجهة" },
    { key: "phone", label: "الهاتف" },
    { key: "service", label: "الخدمة" },
    { key: "amount", label: "المبلغ الإجمالي" },
    { key: "paid", label: "المدفوع" },
    { key: "remaining", label: "المتبقي" },
    { key: "status", label: "الحالة" },
    { key: "createdAt", label: "تاريخ الإنشاء" },
  ];

  if (format === "excel") {
    const html = toExcelHtml(rows, columns);
    return new Response(html, {
      headers: {
        "content-type": "application/vnd.ms-excel; charset=utf-8",
        "content-disposition": `attachment; filename=debts-${Date.now()}.xls`,
      },
    });
  }

  const csv = toCsv(rows, columns);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename=debts-${Date.now()}.csv`,
    },
  });
}
