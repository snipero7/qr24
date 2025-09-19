"use client";
import { useEffect, useRef, useState } from "react";
import { Save, Store, MessageSquare, FileText, MonitorCog, Database, Shield, ImagePlus, Menu } from "lucide-react";
import { DataTab } from "@/components/settings/DataTab";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast";

function UploadButton({ onUploaded }: { onUploaded: (url: string) => void }) {
  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/uploads', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'فشل الرفع');
      onUploaded(data.url);
      try { showToast('تم رفع الملف', 'success'); } catch {}
    } catch (e:any) {
      try { showToast(e.message || 'فشل الرفع', 'error'); } catch {}
    } finally {
      try { input.value = ''; } catch {}
    }
  }
  return (
    <label className="icon-ghost cursor-pointer" title="رفع" aria-label="رفع">
      <ImagePlus size={20} />
      <input type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={onChange} />
    </label>
  );
}

type Tab = "store"|"notify"|"receipt"|"ui"|"data"|"advanced";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("store");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string| null>(null);
  const [s, setS] = useState<any>({});
  const [navOpen, setNavOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  const tabsConfig: Array<{ key: Tab; label: string; Icon: any }> = [
    { key: "store", label: "المتجر", Icon: Store },
    { key: "notify", label: "الرسائل", Icon: MessageSquare },
    { key: "receipt", label: "الإيصال", Icon: FileText },
    { key: "ui", label: "الواجهة", Icon: MonitorCog },
    { key: "data", label: "البيانات", Icon: Database },
    { key: "advanced", label: "متقدم", Icon: Shield },
  ];

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        setS(data);
      } catch (e:any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!navOpen) return;
    function onDoc(e: MouseEvent) {
      if (!navRef.current) return;
      if (!navRef.current.contains(e.target as Node)) setNavOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [navOpen]);

  async function save(partial: any) {
    setSaving(true); setErr(null);
    try {
      const res = await fetch("/api/settings", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...s, ...partial }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "فشل الحفظ");
      setS(data);
      try { showToast("تم الحفظ بنجاح", "success"); } catch {}
    } catch (e:any) { setErr(e.message); }
    setSaving(false);
  }

  if (loading) return <div className="container">جارٍ التحميل…</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">الإعدادات</h1>
      {err && <div className="text-red-600 text-sm">{err}</div>}

      <div className="card tonal p-0">
        <div className="card-header flex-wrap gap-2" ref={navRef}>
          <div className="hidden md:flex items-center gap-2 settings-tabs">
            {tabsConfig.map(({ key, label, Icon }) => (
              <button
                key={key}
                className={`icon-ghost inline-flex items-center gap-1 ${tab===key?'text-[var(--color-primary-700)]':''}`}
                onClick={() => { setTab(key); setNavOpen(false); }}
                title={label}
                aria-label={label}
                data-label={label}
              >
                <Icon size={24} />
                <span className="text-sm">{label}</span>
              </button>
            ))}
          </div>
          <div className="md:hidden w-full" >
            <button
              type="button"
              className="icon-ghost w-full justify-between"
              data-label="القائمة"
              aria-label="القائمة"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((o) => !o)}
            >
              <Menu size={22} />
            </button>
            {navOpen && (
              <div className="mt-2 card space-y-1">
                {tabsConfig.map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    className={`icon-ghost w-full justify-start ${tab===key?'text-[var(--color-primary-700)]':''}`}
                    data-label={label}
                    aria-label={label}
                    onClick={() => { setTab(key); setNavOpen(false); }}
                  >
                    <Icon size={20} />
                    <span className="text-sm">{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card-section">
          {tab === 'store' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <L label="اسم المتجر"><Input value={s.storeName||''} onChange={e=>setS({...s, storeName: e.target.value})}/></L>
              <L label="رقم التواصل">
                <PhoneInput
                  value={s.storePhone || ''}
                  onChange={(e) => setS({ ...s, storePhone: e.target.value })}
                />
              </L>
              <L label="العنوان"><Input value={s.storeAddress||''} onChange={e=>setS({...s, storeAddress: e.target.value})}/></L>
              <L label="شعار المتجر (URL)">
                <div className="flex items-center gap-2">
                  <Input value={s.storeLogoUrl||''} onChange={e=>setS({...s, storeLogoUrl: e.target.value})}/>
                  <UploadButton onUploaded={(url)=>{ setS({...s, storeLogoUrl: url}); save({ storeLogoUrl: url }); }} />
                </div>
              </L>
              <div className="sm:col-span-2 flex justify-end"><Button onClick={()=>save({ storeName: s.storeName, storePhone: s.storePhone, storeAddress: s.storeAddress, storeLogoUrl: s.storeLogoUrl })} disabled={saving} className="icon-ghost" aria-label="حفظ معلومات المتجر"><Save size={24}/></Button></div>
            </div>
          )}

          {tab === 'notify' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <L label="order.ready"><Textarea rows={4} value={s.waTemplates?.["order.ready"]||''} onChange={e=>setS({...s, waTemplates: { ...(s.waTemplates||{}), ["order.ready"]: e.target.value }})}/></L>
              <L label="order.delivered"><Textarea rows={4} value={s.waTemplates?.["order.delivered"]||''} onChange={e=>setS({...s, waTemplates: { ...(s.waTemplates||{}), ["order.delivered"]: e.target.value }})}/></L>
              <L label="debt.reminder"><Textarea rows={4} value={s.waTemplates?.["debt.reminder"]||''} onChange={e=>setS({...s, waTemplates: { ...(s.waTemplates||{}), ["debt.reminder"]: e.target.value }})}/></L>
              <L label="تفعيل أزرار واتساب"><Select value={(s.waEnabled?'1':'0')} onChange={e=>setS({...s, waEnabled: e.target.value==='1'})}><option value="1">مفعّل</option><option value="0">معطّل</option></Select></L>
              <L label="أيام تذكير الدين"><Input type="number" value={s.debtReminderDays||7} onChange={e=>setS({...s, debtReminderDays: Number(e.target.value)})}/></L>
              <div className="sm:col-span-2 flex justify-end"><Button onClick={()=>save({ waTemplates: s.waTemplates, waEnabled: s.waEnabled, debtReminderDays: s.debtReminderDays })} disabled={saving} className="icon-ghost" aria-label="حفظ إعدادات الرسائل"><Save size={24}/></Button></div>
            </div>
          )}

          {tab === 'receipt' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <L label="نص أسفل الإيصال"><Textarea rows={3} value={s.receiptFooter||''} onChange={e=>setS({...s, receiptFooter: e.target.value})}/></L>
              <L label="لغة الإيصال"><Select value={s.receiptLang||'AR'} onChange={e=>setS({...s, receiptLang: e.target.value})}><option value="AR">عربي فقط</option><option value="AR_EN">عربي + إنجليزي</option></Select></L>
              <L label="إظهار QR"><Select value={(s.receiptQrEnabled?'1':'0')} onChange={e=>setS({...s, receiptQrEnabled: e.target.value==='1'})}><option value="1">نعم</option><option value="0">لا</option></Select></L>
              <L label="ختم المتجر (URL)">
                <div className="flex items-center gap-2">
                  <Input value={s.receiptStampUrl||''} onChange={e=>setS({...s, receiptStampUrl: e.target.value})}/>
                  <UploadButton onUploaded={(url)=>{ setS({...s, receiptStampUrl: url}); save({ receiptStampUrl: url }); }} />
                </div>
              </L>
              <div className="sm:col-span-2 flex justify-end"><Button onClick={()=>save({ receiptFooter: s.receiptFooter, receiptLang: s.receiptLang, receiptQrEnabled: s.receiptQrEnabled, receiptStampUrl: s.receiptStampUrl })} disabled={saving} className="icon-ghost" aria-label="حفظ إعدادات الإيصال"><Save size={24}/></Button></div>
            </div>
          )}

          {tab === 'ui' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <L label="الوضع الافتراضي"><Select value={s.uiTheme||'light'} onChange={e=>setS({...s, uiTheme: e.target.value})}><option value="light">فاتح</option><option value="dark">داكن</option></Select></L>
              <L label="صفوف الجداول"><Select value={String(s.uiTableRows||25)} onChange={e=>setS({...s, uiTableRows: Number(e.target.value)})}><option value="10">10</option><option value="25">25</option><option value="50">50</option></Select></L>
              <div className="sm:col-span-2 flex justify-end"><Button onClick={()=>save({ uiTheme: s.uiTheme, uiTableRows: s.uiTableRows })} disabled={saving} className="icon-ghost" aria-label="حفظ إعدادات الواجهة"><Save size={24}/></Button></div>
            </div>
          )}

          {tab === 'data' && (<DataTab />)}

          {tab === 'advanced' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <L label="S3 Endpoint"><Input value={s.s3Endpoint||''} onChange={e=>setS({...s, s3Endpoint: e.target.value})}/></L>
              <L label="S3 Bucket"><Input value={s.s3Bucket||''} onChange={e=>setS({...s, s3Bucket: e.target.value})}/></L>
              <L label="S3 Access Key"><Input type="password" value={s.s3AccessKey||''} onChange={e=>setS({...s, s3AccessKey: e.target.value})}/></L>
              <L label="S3 Secret"><Input type="password" value={s.s3Secret||''} onChange={e=>setS({...s, s3Secret: e.target.value})}/></L>
              <L label="Redis URL"><Input value={s.redisUrl||''} onChange={e=>setS({...s, redisUrl: e.target.value})}/></L>
              <div className="sm:col-span-2 flex justify-end"><Button onClick={()=>save({ s3Endpoint: s.s3Endpoint, s3Bucket: s.s3Bucket, s3AccessKey: s.s3AccessKey, s3Secret: s.s3Secret, redisUrl: s.redisUrl })} className="icon-ghost" aria-label="حفظ الإعدادات المتقدمة"><Save size={24}/></Button></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
