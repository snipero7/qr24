import { prisma } from "@/server/db";
import { getAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { AddPaymentDialog } from "@/components/debts/AddPaymentDialog";

export default async function DebtsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/signin");
  const items = await prisma.debt.findMany({ include: { payments: true }, orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">الديون</h1>
      <div className="flex items-center gap-2">
        <NewDebtForm />
        <a className="border px-3 py-2 rounded" href="/api/debts/export">تصدير CSV</a>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">المحل</th>
              <th className="p-2">الخدمة</th>
              <th className="p-2">الإجمالي</th>
              <th className="p-2">المدفوع</th>
              <th className="p-2">المتبقي</th>
              <th className="p-2">الحالة</th>
              <th className="p-2">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {items.map(d => {
              const paid = d.payments.reduce((s,p)=>s+Number(p.amount),0);
              const remaining = Math.max(0, Number(d.amount)-paid);
              return (
                <tr key={d.id} className="border-b">
                  <td className="p-2"><a className="text-blue-600" href={`/debts/${d.id}`}>{d.shopName}</a></td>
                  <td className="p-2">{d.service}</td>
                  <td className="p-2">{String(d.amount)}</td>
                  <td className="p-2">{paid}</td>
                  <td className="p-2">{remaining}</td>
                  <td className="p-2">{d.status}</td>
                  <td className="p-2"><AddPaymentDialog debtId={d.id} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NewDebtForm() {
  return (
    <form action={createDebt} className="grid grid-cols-1 sm:grid-cols-5 gap-2 border p-3 rounded bg-white">
      <input name="shopName" required placeholder="اسم المحل" className="border rounded p-2" />
      <input name="service" required placeholder="الخدمة" className="border rounded p-2" />
      <input name="amount" required type="number" placeholder="المبلغ" className="border rounded p-2" />
      <input name="notes" placeholder="ملاحظات" className="border rounded p-2" />
      <button className="bg-blue-600 text-white rounded px-3">إضافة دين</button>
    </form>
  );
}

async function createDebt(formData: FormData) {
  "use server";
  const payload = {
    shopName: String(formData.get("shopName")),
    service: String(formData.get("service")),
    amount: Number(formData.get("amount")),
    notes: (formData.get("notes") as string) || undefined,
  };
  await prisma.debt.create({ data: { shopName: payload.shopName, service: payload.service, amount: payload.amount, notes: payload.notes, status: 'OPEN' } });
}
