import { prisma } from "@/server/db";
import { createOrderSchema, errorResponse } from "@/server/validation";
import { generateShortCode } from "@/server/qr";
import { requireAuth } from "@/server/auth";

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(["ADMIN","CLERK"]);
    if (!auth.ok) return Response.json({ code: "UNAUTHORIZED", message: auth.message }, { status: auth.status });
    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) return errorResponse("INVALID_INPUT", "بيانات غير صالحة", parsed.error.flatten());
    const { customer, deviceModel, imei, service, originalPrice } = parsed.data;

    // Upsert customer by phone
    const cust = await prisma.customer.upsert({
      where: { phone: customer.phone },
      update: { name: customer.name, notes: customer.notes },
      create: { name: customer.name, phone: customer.phone, notes: customer.notes },
    });

    const code = await uniqueCode();

    const order = await prisma.order.create({
      data: {
        code,
        customerId: cust.id,
        deviceModel,
        imei,
        service,
        originalPrice: originalPrice,
        status: "NEW",
        statusLogs: { create: { to: "NEW", note: "Order created" } },
      },
      select: { id: true, code: true, status: true },
    });

    return Response.json(order);
  } catch (e: any) {
    return errorResponse("SERVER_ERROR", e?.message || "حدث خطأ غير متوقع");
  }
}

export async function GET(req: Request) {
  const auth = await requireAuth(["ADMIN","CLERK","TECH"]);
  if (!auth.ok) return Response.json({ code: "UNAUTHORIZED", message: auth.message }, { status: auth.status });
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") ?? searchParams.get("q") ?? undefined;
  const status = (searchParams.get("status") as any) || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const take = Math.min(parseInt(searchParams.get("take") || "20"), 100);
  const skip = (page - 1) * take;

  const createdFrom = searchParams.get("createdFrom");
  const createdTo = searchParams.get("createdTo");
  const priceMin = searchParams.get("priceMin");
  const priceMax = searchParams.get("priceMax");
  const phone = searchParams.get("phone") || undefined;

  const where: any = {};
  if (status) where.status = status;
  if (query) {
    where.OR = [
      { code: { contains: query, mode: "insensitive" } },
      { customer: { is: { phone: { contains: query } } } },
    ];
  }
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

  const [items, total] = await Promise.all([
    prisma.order.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, include: { customer: true } }),
    prisma.order.count({ where }),
  ]);

  return Response.json({ items, total, page, pages: Math.ceil(total / take) });
}

async function uniqueCode() {
  for (let i = 0; i < 5; i++) {
    const code = generateShortCode();
    const exists = await prisma.order.findUnique({ where: { code } });
    if (!exists) return code;
  }
  // fallback to a longer code
  return generateShortCode() + generateShortCode();
}
