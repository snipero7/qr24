import { prisma } from "@/server/db";
import { getAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { AddPaymentDialog } from "@/components/debts/AddPaymentDialog";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

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
        <Table>
          <THead>
            <TR>
              <TH>المحل</TH>
              <TH>الخدمة</TH>
              <TH>الإجمالي</TH>
              <TH>المدفوع</TH>
              <TH>المتبقي</TH>
              <TH>الحالة</TH>
              <TH>إجراء</TH>
            </TR>
          </THead>
          <TBody>
            {items.map(d => {
              const paid = d.payments.reduce((s,p)=>s+Number(p.amount),0);
              const remaining = Math.max(0, Number(d.amount)-paid);
              return (
                <TR key={d.id}>
                  <TD><a className="text-blue-600" href={`/debts/${d.id}`}>{d.shopName}</a></TD>
                  <TD>{d.service}</TD>
                  <TD>{String(d.amount)}</TD>
                  <TD>{paid}</TD>
                  <TD>{remaining}</TD>
                  <TD>{d.status}</TD>
                  <TD><AddPaymentDialog debtId={d.id} /></TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
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
