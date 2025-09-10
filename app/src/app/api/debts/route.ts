import { prisma } from "@/server/db";
import { createDebtSchema, errorResponse } from "@/server/validation";
import { requireAuth } from "@/server/auth";

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.ok) return errorResponse("UNAUTHORIZED", auth.message);
    const body = await req.json();
    const parsed = createDebtSchema.safeParse(body);
    if (!parsed.success) return errorResponse("INVALID_INPUT", "بيانات غير صالحة", parsed.error.flatten());
    const { shopName, phone, service, amount, notes } = parsed.data;
    const debt = await prisma.debt.create({
      data: { shopName, phone, service, amount: amount, notes, status: "OPEN" },
    });
    return Response.json(debt);
  } catch (e: any) {
    return errorResponse("SERVER_ERROR", e?.message || "خطأ");
  }
}

export async function GET() {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.ok) return Response.json({ code: "UNAUTHORIZED", message: auth.message }, { status: auth.status });
  const items = await prisma.debt.findMany({ include: { payments: true }, orderBy: { createdAt: "desc" } });
  return Response.json(items);
}
