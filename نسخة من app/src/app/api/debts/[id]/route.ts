import { prisma } from "@/server/db";
import { errorResponse } from "@/server/validation";
import { requireAuth } from "@/server/auth";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.ok) return errorResponse("UNAUTHORIZED", auth.message);
    const body = await req.json();
    const data: any = {};
    if (typeof body.shopName === 'string') data.shopName = body.shopName;
    if (typeof body.phone === 'string' || body.phone === null) data.phone = body.phone || null;
    if (typeof body.service === 'string') data.service = body.service;
    if (typeof body.notes === 'string' || body.notes === null) data.notes = body.notes || null;
    if (typeof body.amount === 'number' && !Number.isNaN(body.amount) && body.amount > 0) data.amount = body.amount;
    if (Object.keys(data).length === 0) return errorResponse("INVALID_INPUT", "لا توجد حقول للتعديل");

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.debt.update({ where: { id }, data });
      // recompute status based on payments
      const paidAgg = await tx.debtPayment.aggregate({ _sum: { amount: true }, where: { debtId: u.id } });
      const totalPaid = Number(paidAgg._sum.amount || 0);
      let status: any = "OPEN";
      if (totalPaid <= 0) status = "OPEN";
      else if (totalPaid < Number(u.amount)) status = "PARTIAL";
      else status = "PAID";
      if (status !== u.status) {
        await tx.debt.update({ where: { id: u.id }, data: { status } });
        return { ...u, status };
      }
      return u;
    });
    return Response.json({ ok: true, debt: updated });
  } catch (e: any) {
    return errorResponse("SERVER_ERROR", e?.message || "خطأ");
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.ok) return errorResponse("UNAUTHORIZED", auth.message);
    const { id } = await ctx.params;
    await prisma.$transaction(async (tx) => {
      await tx.debtPayment.deleteMany({ where: { debtId: id } });
      await tx.debt.delete({ where: { id } });
    });
    return Response.json({ ok: true });
  } catch (e: any) {
    return errorResponse("SERVER_ERROR", e?.message || "خطأ");
  }
}
