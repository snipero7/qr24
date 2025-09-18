import { prisma } from "@/server/db";
import { getAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import NewDebtForm from "@/components/debts/NewDebtForm";
import { normalizeNumberInput } from "@/lib/utils";
import DebtsTree, { DebtGroup } from "@/components/debts/DebtsTree";

export default async function DebtsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/signin");
  const items = await prisma.debt.findMany({ include: { payments: true }, orderBy: { createdAt: "desc" } });
  const shopsMap = new Map<string, { shopName: string; phone?: string | null }>();
  for (const d of items) {
    const key = `${d.shopName}|${d.phone || ''}`;
    if (!shopsMap.has(key)) shopsMap.set(key, { shopName: d.shopName, phone: d.phone });
  }
  const shops = Array.from(shopsMap.values());

  // Build groups per shop
  const groups: DebtGroup[] = [];
  const byKey = new Map<string, DebtGroup>();
  for (const d of items) {
    const paid = d.payments.reduce((s,p)=>s+Number(p.amount),0);
    const remaining = Math.max(0, Number(d.amount)-paid);
    const key = `${d.shopName}|${d.phone || ''}`;
    if (!byKey.has(key)) byKey.set(key, { shopName: d.shopName, phone: d.phone, debts: [] });
    byKey.get(key)!.debts.push({ id: d.id, service: d.service, amount: Number(d.amount), paid, remaining, status: d.status, createdAt: d.createdAt.toISOString() });
  }
  for (const g of byKey.values()) groups.push(g);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">الديون</h1>
      <div className="flex items-center gap-2">
        <NewDebtForm shops={shops} action={createDebt} />
      </div>
      <DebtsTree groups={groups} />
    </div>
  );
}

// kept createDebt server action below

async function createDebt(formData: FormData) {
  "use server";
  const payload = {
    shopName: String(formData.get("shopName")),
    phone: (() => { const raw = (formData.get("phone") as string) || ''; const norm = normalizeNumberInput(raw); return norm || undefined; })(),
    service: String(formData.get("service")),
    amount: Number(formData.get("amount")),
    notes: (formData.get("notes") as string) || undefined,
  };
  await prisma.debt.create({ data: { shopName: payload.shopName, phone: payload.phone, service: payload.service, amount: payload.amount, notes: payload.notes, status: 'OPEN' } });
}
