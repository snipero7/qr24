import { prisma } from "@/server/db";
import { getAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { AddPaymentDialog } from "@/components/debts/AddPaymentDialog";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export default async function DebtShow({ params }: { params: { id: string } }) {
  const session = await getAuthSession();
  if (!session || (session.user as any).role !== "ADMIN") redirect("/signin");

  const d = await prisma.debt.findUnique({ where: { id: params.id }, include: { payments: { orderBy: { at: "desc" } } } });
  if (!d) return <div className="p-6">لا يوجد دين.</div>;

  const paid = d.payments.reduce((s,p)=>s+Number(p.amount),0);
  const remaining = Math.max(0, Number(d.amount)-paid);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">تفاصيل الدين</h1>
        <AddPaymentDialog debtId={d.id} />
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Info label="المحل" value={d.shopName} />
        <Info label="الخدمة" value={d.service} />
        <Info label="الإجمالي" value={String(d.amount)} />
        <Info label="المدفوع" value={String(paid)} />
        <Info label="المتبقي" value={String(remaining)} />
        <Info label="الحالة" value={d.status} />
      </section>

      <section>
        <h2 className="font-semibold mb-2">سجل الدفعات</h2>
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>التاريخ</TH>
                <TH>المبلغ</TH>
              </TR>
            </THead>
            <TBody>
              {d.payments.map(p => (
                <TR key={p.id}>
                  <TD>{new Date(p.at).toLocaleString()}</TD>
                  <TD>{String(p.amount)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border rounded p-3 bg-white">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
