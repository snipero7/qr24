"use client";

import { useState } from "react";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { normalizeNumberInput } from "@/lib/utils";
import { Filter, FileDown, FileSpreadsheet } from "lucide-react";

const statuses = [
  { value: "", label: "كل الحالات" },
  { value: "OPEN", label: "مفتوح" },
  { value: "PARTIAL", label: "مدفوع جزئيًا" },
  { value: "PAID", label: "مدفوع" },
];

export default function DebtsExportDialog() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [shop, setShop] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [remainingMin, setRemainingMin] = useState("");
  const [remainingMax, setRemainingMax] = useState("");

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (shop.trim()) params.set("shop", shop.trim());
    if (createdFrom) params.set("createdFrom", createdFrom);
    if (createdTo) params.set("createdTo", createdTo);
    if (remainingMin) params.set("remainingMin", normalizeNumberInput(remainingMin));
    if (remainingMax) params.set("remainingMax", normalizeNumberInput(remainingMax));
    return params;
  };

  const exportData = (format: "csv" | "excel") => {
    const params = buildQuery();
    if (format === "excel") params.set("format", "excel");
    const href = `/api/debts/export?${params.toString()}`;
    window.open(href, "_blank");
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="inline-flex items-center gap-2">
        <Filter className="w-4 h-4" />
        تصدير الديون
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader title="تصدير الديون" />
        <div className="space-y-3 text-right">
          <label className="block text-sm space-y-1">
            <span>الحالة</span>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {statuses.map((s) => (
                <option key={s.value || "all"} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </label>
          <label className="block text-sm space-y-1">
            <span>اسم الجهة</span>
            <Input value={shop} onChange={(e) => setShop(e.target.value)} placeholder="اسم المحل أو الجهة" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm space-y-1">
              <span>من تاريخ</span>
              <Input type="date" value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} />
            </label>
            <label className="block text-sm space-y-1">
              <span>إلى تاريخ</span>
              <Input type="date" value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm space-y-1">
              <span>المديونية المتبقية من</span>
              <Input
                value={remainingMin}
                inputMode="decimal"
                onChange={(e) => setRemainingMin(e.target.value)}
                placeholder="مثال: 100"
              />
            </label>
            <label className="block text-sm space-y-1">
              <span>المديونية المتبقية إلى</span>
              <Input
                value={remainingMax}
                inputMode="decimal"
                onChange={(e) => setRemainingMax(e.target.value)}
                placeholder="مثال: 2000"
              />
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>إغلاق</Button>
            <Button variant="outline" onClick={() => exportData("csv")} className="inline-flex items-center gap-2">
              <FileDown className="w-4 h-4" /> CSV
            </Button>
            <Button onClick={() => exportData("excel")} className="inline-flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
