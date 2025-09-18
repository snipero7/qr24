import { prisma } from "@/server/db";
import { requireAuth } from "@/server/auth";
import { toCsv, toExcelHtml } from "@/server/csv";

export async function GET(req: Request) {
  const auth = await requireAuth(["ADMIN","CLERK"]);
  if (!auth.ok) return Response.json({ code: "UNAUTHORIZED", message: auth.message }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const format = (searchParams.get("format") || "csv").toLowerCase();
  const q = searchParams.get("q") ?? searchParams.get("query") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const phone = searchParams.get("phone") ?? undefined;
  const createdFrom = searchParams.get("createdFrom");
  const createdTo = searchParams.get("createdTo");
  const priceMin = searchParams.get("priceMin");
  const priceMax = searchParams.get("priceMax");

  const where: any = {};
  if (status) where.status = status;
  if (q) where.OR = [{ code: { contains: q, mode: "insensitive" } }, { customer: { is: { phone: { contains: q } } } }];
  if (phone) where.customer = { is: { phone: { contains: phone } } };
  if (createdFrom || createdTo) {
    where.createdAt = {};
    if (createdFrom) where.createdAt.gte = new Date(createdFrom);
    if (createdTo) { const d = new Date(createdTo); d.setHours(23,59,59,999); where.createdAt.lte = d; }
  }
  if (priceMin || priceMax) {
    where.originalPrice = {};
    if (priceMin) where.originalPrice.gte = Number(priceMin);
    if (priceMax) where.originalPrice.lte = Number(priceMax);
  }

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

  const columns = [
    { key: "id", label: "المعرف" },
    { key: "code", label: "الكود" },
    { key: "status", label: "الحالة" },
    { key: "customer", label: "العميل" },
    { key: "phone", label: "الجوال" },
    { key: "service", label: "الخدمة" },
    { key: "deviceModel", label: "الجهاز" },
    { key: "originalPrice", label: "السعر الأساسي" },
    { key: "collectedPrice", label: "المبلغ المحصّل" },
    { key: "createdAt", label: "تاريخ الإنشاء" },
    { key: "updatedAt", label: "آخر تحديث" },
    { key: "collectedAt", label: "تاريخ التحصيل" },
  ];

  if (format === "excel") {
    const html = toExcelHtml(rows, columns);
    return new Response(html, {
      headers: {
        "content-type": "application/vnd.ms-excel; charset=utf-8",
        "content-disposition": `attachment; filename=orders-${Date.now()}.xls`,
      },
    });
  }

  const csv = toCsv(rows, columns);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename=orders-${Date.now()}.csv`,
    },
  });
}
