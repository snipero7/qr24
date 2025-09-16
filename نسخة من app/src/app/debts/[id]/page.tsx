import { prisma } from "@/server/db";
import { getAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { AddPaymentDialog } from "@/components/debts/AddPaymentDialog";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { debtTemplateForStatus } from "@/config/notifications";
import { formatYMD_HM } from "@/lib/date";

export default async function DebtShow({ params }: { params: Promise<{ id: string }> }) {
  const p: any = await params; const id: string | undefined = p?.id ?? p?.params?.id;
  const session = await getAuthSession();
  if (!session || (session.user as any).role !== "ADMIN") redirect("/signin");
  if (!id) return <div className="p-6">لا يوجد دين.</div>;
  const d = await prisma.debt.findUnique({ where: { id }, include: { payments: { orderBy: { at: "desc" } } } });
  if (!d) return <div className="p-6">لا يوجد دين.</div>;

  const paid = d.payments.reduce((s,p)=>s+Number(p.amount),0);
  const remaining = Math.max(0, Number(d.amount)-paid);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">تفاصيل الدين</h1>
        <div className="flex items-center gap-2">
          <WhatsAppButton
            phone={d.phone}
            templateKey={debtTemplateForStatus(d.status) as any}
            params={{ shopName: d.shopName, service: d.service, amount: Number(d.amount), paid, remaining }}
            variant="icon"
          />
          <AddPaymentDialog debtId={d.id} />
        </div>
      </div>

      <section className="card tonal">
        <div className="card-header">
          <h2 className="card-title">ملخص الدين</h2>
        </div>
        <div className="card-section grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Info label="المحل" value={d.shopName} />
          <Info label="الخدمة" value={d.service} />
          <Info label="الإجمالي" value={String(d.amount)} />
          <Info label="المدفوع" value={String(paid)} />
          <Info label="المتبقي" value={String(remaining)} />
          <Info label="الحالة" value={<StatusBadge status={d.status as any} />} />
        </div>
      </section>

      <section className="card tonal p-0">
        <div className="card-header">
          <h2 className="card-title">سجل الدفعات</h2>
        </div>
        <div className="card-section overflow-x-auto">
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
                  <TD>{formatYMD_HM(p.at as any)}</TD>
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
    <div className="rounded-lg border border-black/10 dark:border-white/10 bg-[var(--surface)] p-3 flex items-baseline justify-between gap-4">
      <div className="text-xs text-gray-500 shrink-0">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
