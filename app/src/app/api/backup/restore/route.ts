import { getAuthSession } from "@/server/auth";
import { prisma } from "@/server/db";
import path from "node:path";
import fs from "node:fs/promises";
import zlib from "node:zlib";

export async function POST(req: Request) {
  const auth = await getAuthSession();
  if (!auth || (auth.user as any)?.role !== 'ADMIN') {
    return Response.json({ code: 'UNAUTHORIZED' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return Response.json({ code: 'INVALID_INPUT', message: 'missing id' }, { status: 400 });
  const log = await prisma.backupLog.findUnique({ where: { id } });
  if (!log) return Response.json({ code: 'NOT_FOUND' }, { status: 404 });
  if (!log.fileUrl || !log.fileUrl.startsWith('/backups/')) {
    return Response.json({ code: 'UNSUPPORTED', message: 'restore supports local backups only' }, { status: 400 });
  }

  try {
    const filePath = path.join(process.cwd(), 'public', log.fileUrl.replace(/^\//, ''));
    const gz = await fs.readFile(filePath);
    const json = zlib.gunzipSync(gz).toString('utf-8');
    const parsed = JSON.parse(json) as any;
    const orders: any[] = parsed.orders || [];
    const debts: any[] = parsed.debts || [];
    const payments: any[] = parsed.payments || [];

    await prisma.$transaction(async (tx) => {
      for (const o of orders) {
        const exists = await tx.order.findUnique({ where: { code: o.code } });
        if (exists) continue;
        const cust = await tx.customer.upsert({
          where: { phone: o.customer.phone },
          update: { name: o.customer.name },
          create: { id: o.customer.id, name: o.customer.name, phone: o.customer.phone },
        });
        const created = await tx.order.create({
          data: {
            id: o.id,
            code: o.code,
            customerId: cust.id,
            deviceModel: o.deviceModel || null,
            imei: o.imei || null,
            service: o.service,
            originalPrice: Number(o.originalPrice || 0),
            extraCharge: Number(o.extraCharge || 0),
            extraReason: o.extraReason || null,
            collectedPrice: o.collectedPrice !== null ? Number(o.collectedPrice) : null,
            paymentMethod: (o as any).paymentMethod || null,
            status: o.status,
            collectedAt: o.collectedAt ? new Date(o.collectedAt) : null,
            createdAt: o.createdAt ? new Date(o.createdAt) : undefined,
            updatedAt: o.updatedAt ? new Date(o.updatedAt) : undefined,
            receiptUrl: o.receiptUrl || null,
          },
        });
        if (Array.isArray(o.statusLogs)) {
          for (const l of o.statusLogs) {
            await tx.orderStatusLog.create({ data: { id: l.id, orderId: created.id, from: l.from, to: l.to, at: l.at ? new Date(l.at) : undefined, note: l.note || null } });
          }
        }
      }
      for (const d of debts) {
        const exists = await tx.debt.findUnique({ where: { id: d.id } });
        if (!exists) {
          await tx.debt.create({ data: { id: d.id, shopName: d.shopName, phone: d.phone || null, service: d.service, amount: Number(d.amount), status: d.status, notes: d.notes || null, createdAt: d.createdAt ? new Date(d.createdAt) : undefined } });
        }
      }
      for (const p of payments) {
        const exists = await tx.debtPayment.findUnique({ where: { id: p.id } });
        if (!exists) {
          await tx.debtPayment.create({ data: { id: p.id, debtId: p.debtId, amount: Number(p.amount), at: p.at ? new Date(p.at) : undefined } });
        }
      }
    });

    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ code: 'SERVER_ERROR', message: e?.message || 'failed' }, { status: 500 });
  }
}

