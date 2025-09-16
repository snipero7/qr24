import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, renderToBuffer, Font } from "@react-pdf/renderer";
import fs from "node:fs";
import path from "node:path";
import { storeConfig } from "@/config/notifications";
import { getSettings } from "@/server/settings";
import { formatYMD_HM } from "@/lib/date";

type OrderInfo = {
  code: string;
  service: string;
  deviceModel?: string | null;
  collectedPrice: number;
  collectedAt: Date;
  originalPrice?: number | null;
  extraCharge?: number | null;
  extraReason?: string | null;
  customer: { name: string; phone: string };
};

let fontChecked = false;
let chosenFont: string | null = null;
function ensureArabicFont(): string | null {
  if (fontChecked) return chosenFont;
  try {
    // Prevent hyphenation/splitting for Arabic words on all PDFs
    try { Font.registerHyphenationCallback((word) => [word]); } catch {}
    const fontsDir = path.join(process.cwd(), "public", "fonts");
    // Try Cairo
    const cairoRegular = path.join(fontsDir, "Cairo-Regular.ttf");
    const cairoBold = path.join(fontsDir, "Cairo-Bold.ttf");
    if (fs.existsSync(cairoRegular)) {
      Font.register({
        family: "Cairo",
        fonts: [
          { src: cairoRegular, fontWeight: "normal" },
          fs.existsSync(cairoBold) ? { src: cairoBold, fontWeight: "bold" } : undefined,
        ].filter(Boolean) as any,
      });
      chosenFont = "Cairo";
    } else {
      // Try Noto Naskh Arabic
      const notoRegular = path.join(fontsDir, "NotoNaskhArabic-Regular.ttf");
      const notoBold = path.join(fontsDir, "NotoNaskhArabic-Bold.ttf");
      if (fs.existsSync(notoRegular)) {
        Font.register({
          family: "NotoNaskhArabic",
          fonts: [
            { src: notoRegular, fontWeight: "normal" },
            fs.existsSync(notoBold) ? { src: notoBold, fontWeight: "bold" } : undefined,
          ].filter(Boolean) as any,
        });
        chosenFont = "NotoNaskhArabic";
      } else {
        // Try Amiri
        const amiriRegular = path.join(fontsDir, "Amiri-Regular.ttf");
        const amiriBold = path.join(fontsDir, "Amiri-Bold.ttf");
        if (fs.existsSync(amiriRegular)) {
          Font.register({
            family: "Amiri",
            fonts: [
              { src: amiriRegular, fontWeight: "normal" },
              fs.existsSync(amiriBold) ? { src: amiriBold, fontWeight: "bold" } : undefined,
            ].filter(Boolean) as any,
          });
          chosenFont = "Amiri";
        }
      }
    }
  } catch {}
  fontChecked = true;
  return chosenFont;
}

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 12, direction: "rtl" as any },
  header: { fontSize: 18, marginBottom: 12, textAlign: "right" },
  subheader: { fontSize: 10, color: "#666", marginTop: -8, marginBottom: 12, textAlign: "right" },
  row: { flexDirection: "row-reverse", justifyContent: "space-between", marginBottom: 4 },
  label: { color: "#555" },
  box: { borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 6, marginTop: 8 },
  qr: { width: 110, height: 110 },
});

function formatSAR(n: number) {
  try {
    return new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR" }).format(n);
  } catch {
    return `${n.toFixed(2)} ر.س`;
  }
}

function formatDate(d: Date) { return formatYMD_HM(d); }

export async function generateReceiptPdf(order: OrderInfo, qrDataUrl: string) {
  // Load settings (store name/address, footer, language, QR toggle, stamp)
  const s = await getSettings();
  const storeName = s?.storeName || storeConfig.storeName;
  const storeAddress = s?.storeAddress || storeConfig.storeAddress;
  const receiptFooter = s?.receiptFooter || "";
  const showQr = s?.receiptQrEnabled !== false;
  const receiptLang = (s?.receiptLang as any) || "AR"; // "AR" | "AR_EN"
  const stampUrl = s?.receiptStampUrl || undefined;
  const font = ensureArabicFont();
  if (!font) {
    try { console.warn('[receipt] Arabic font not found in public/fonts. Arabic text may render incorrectly.'); } catch {}
  }
  const hasLogo = !!process.env.NEXT_PUBLIC_STORE_LOGO;
  const logoPath = process.env.NEXT_PUBLIC_STORE_LOGO
    ? path.isAbsolute(process.env.NEXT_PUBLIC_STORE_LOGO)
      ? process.env.NEXT_PUBLIC_STORE_LOGO
      : path.join(process.cwd(), "public", process.env.NEXT_PUBLIC_STORE_LOGO)
    : undefined;

  const doc = (
    <Document>
      <Page size="A4" style={{ ...styles.page, ...(font ? { fontFamily: font } : {}) }}>
        <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <Text style={styles.header}>إيصال تسليم</Text>
          {hasLogo && logoPath ? <Image style={{ width: 96, height: 36 }} src={logoPath} /> : null}
        </View>
        <Text style={styles.subheader}>{storeName} — {storeAddress}</Text>
        <View style={styles.box}>
          <View style={styles.row}>
            <Text style={styles.label}>كود الطلب{receiptLang === 'AR_EN' ? ' / Order Code' : ''}:</Text>
            <Text>{order.code}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>العميل{receiptLang === 'AR_EN' ? ' / Customer' : ''}:</Text>
            <Text>{order.customer.name} ({order.customer.phone})</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>الخدمة{receiptLang === 'AR_EN' ? ' / Service' : ''}:</Text>
            <Text>{order.service}</Text>
          </View>
          {order.deviceModel && (
            <View style={styles.row}>
              <Text style={styles.label}>الجهاز{receiptLang === 'AR_EN' ? ' / Device' : ''}:</Text>
              <Text>{order.deviceModel}</Text>
            </View>
          )}
          {(() => {
            const base = typeof order.originalPrice === 'number' ? (order.originalPrice || 0) : 0;
            const extra = typeof order.extraCharge === 'number' ? (order.extraCharge || 0) : 0;
            const effective = base + extra;
            const discount = Math.max(0, effective - order.collectedPrice);
            return (
              <>
                <View style={styles.row}>
                  <Text style={styles.label}>السعر الأساسي{receiptLang === 'AR_EN' ? ' / Base Price' : ''}:</Text>
                  <Text>{formatSAR(base)}</Text>
                </View>
                {extra > 0 ? (
                  <View style={styles.row}>
                    <Text style={styles.label}>رسوم إضافية{order.extraReason ? ` (${order.extraReason})` : ''}{receiptLang === 'AR_EN' ? ' / Extra' : ''}:</Text>
                    <Text>{formatSAR(extra)}</Text>
                  </View>
                ) : null}
                <View style={styles.row}>
                  <Text style={styles.label}>الإجمالي قبل الخصم{receiptLang === 'AR_EN' ? ' / Total before Discount' : ''}:</Text>
                  <Text>{formatSAR(effective)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>الخصم{receiptLang === 'AR_EN' ? ' / Discount' : ''}:</Text>
                  <Text>{formatSAR(discount)}</Text>
                </View>
              </>
            );
          })()}
          <View style={styles.row}>
            <Text style={styles.label}>المبلغ بعد الخصم{receiptLang === 'AR_EN' ? ' / Amount Paid' : ''}:</Text>
            <Text>{formatSAR(order.collectedPrice)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>تاريخ التسليم{receiptLang === 'AR_EN' ? ' / Delivered At' : ''}:</Text>
            <Text>{formatDate(order.collectedAt)}</Text>
          </View>
        </View>
        {showQr && (
          <View style={{ marginTop: 16, alignItems: "center" }}>
            <Image style={styles.qr} src={qrDataUrl} />
            <Text>للتتبع: /track/{order.code}</Text>
          </View>
        )}
        {stampUrl ? (
          <View style={{ marginTop: 12, alignItems: "flex-start" }}>
            {/* Stamp placed lightly at left (considering RTL layout) */}
            <Image style={{ width: 120, height: 120, opacity: 0.85 }} src={stampUrl} />
          </View>
        ) : null}
        {receiptFooter ? (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontSize: 10, color: "#666" }}>{receiptFooter}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );

  const buffer = await renderToBuffer(doc);
  return buffer;
}

// Thermal 80mm receipt (approx width 80mm => ~226.77pt)
export async function generateThermalReceiptPdf(order: OrderInfo & { paymentMethod?: 'CASH'|'TRANSFER' }, qrDataUrl: string) {
  const s = await getSettings();
  const storeName = s?.storeName || storeConfig.storeName;
  const storeAddress = s?.storeAddress || storeConfig.storeAddress;
  const storePhone = (s as any)?.storePhone || '';
  const receiptFooter = s?.receiptFooter || '';
  const showQr = s?.receiptQrEnabled !== false;
  const stampUrl = s?.receiptStampUrl || undefined;
  const font = ensureArabicFont();
  const receiptLang = (s as any)?.receiptLang || 'AR'; // 'AR' | 'AR_EN'

  // Resolve store logo from settings or env (local path or URL)
  let logoPath: string | undefined;
  // Use only Settings.storeLogoUrl as requested
  const configuredLogo = (s as any)?.storeLogoUrl;
  if (configuredLogo && typeof configuredLogo === 'string') {
    // Resolve: http(s) stays URL; anything else is treated as web-root relative under public/
    let tentative: string;
    if (/^https?:\/\//i.test(configuredLogo)) {
      tentative = configuredLogo;
    } else {
      const rel = configuredLogo.replace(/^\//, '');
      tentative = path.join(process.cwd(), 'public', rel);
    }
    // @react-pdf supports PNG/JPG; skip SVG to avoid silent failure
    const ext = path.extname((tentative || '').split('?')[0]).toLowerCase();
    const supported = [ '.png', '.jpg', '.jpeg' ];
    if (!ext || supported.includes(ext) || /^https?:\/\//i.test(tentative)) {
      logoPath = tentative;
    } else {
      try { console.warn('[receipt] storeLogoUrl not a supported image type for PDF:', tentative); } catch {}
    }
  }

  // Prepare logo source: use HTTP URL directly, or read local file into Buffer
  let logoSrc: string | Uint8Array | undefined;
  if (logoPath) {
    if (/^https?:\/\//i.test(logoPath)) {
      logoSrc = logoPath;
    } else {
      try {
        if (fs.existsSync(logoPath)) {
          logoSrc = fs.readFileSync(logoPath);
        } else {
          try { console.warn('[receipt] logo file not found at path:', logoPath); } catch {}
        }
      } catch {}
    }
  }

  const W = 226.77; // 80mm
  const H = 800; // enough for short receipt
  const styles80 = StyleSheet.create({
    page: { padding: 10, fontSize: 9, direction: 'rtl' as any },
    center: { textAlign: 'center' as any, alignItems: 'center' as any },
    row: { flexDirection: 'row-reverse' as any, justifyContent: 'space-between', marginBottom: 4 },
    labelBlock: { alignItems: 'flex-end' as any },
    inline: { flexDirection: 'row-reverse' as any, alignItems: 'center' },
    ltr: { direction: 'ltr' as any, textAlign: 'left' as any },
    sep: { marginVertical: 4, borderBottomWidth: 1, borderBottomColor: '#ddd' },
    // Table-like grid
    table: { marginTop: 2 },
    tr: { flexDirection: 'row-reverse' as any, alignItems: 'center', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: '#eee' },
    th: { width: '46%' as any, paddingRight: 4, alignItems: 'flex-end' as any },
    td: { width: '54%' as any, alignItems: 'flex-start' as any },
  });

  const sarSymbol = (font ? ' ﷼' : ' ر.س');
  function sar(n: number) { return `${Number(n).toFixed(2)}${sarSymbol}`; }
  // Bilingual helpers: Arabic right, English left
  function LabelSplit(ar: string, en: string) {
    if (receiptLang !== 'AR_EN') return <Text>{ar}</Text>;
    return (
      <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', width: '100%' as any }}>
        <Text>{ar}</Text>
        <Text style={{ fontSize: 7, direction: 'ltr' as any, textAlign: 'left' as any, color: '#666' }}>{en}</Text>
      </View>
    );
  }
  function ValueSplit(ar: string, en: string) {
    if (receiptLang !== 'AR_EN') return <Text>{ar}</Text>;
    return (
      <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', width: '100%' as any }}>
        <Text>{ar}</Text>
        <Text style={{ direction: 'ltr' as any, textAlign: 'left' as any }}>{en}</Text>
      </View>
    );
  }
  function L(ar: string, en: string) { return receiptLang === 'AR_EN' ? `${ar} / ${en}` : ar; }
  function paymentLabel(m?: 'CASH'|'TRANSFER') {
    if (!m) return '';
    if (m === 'CASH') return receiptLang === 'AR_EN' ? 'نقدًا / Cash' : 'نقدًا';
    return receiptLang === 'AR_EN' ? 'تحويل / Transfer' : 'تحويل';
  }
  // (Reverted) No special embedding — rely on font and RTL page direction
  const base = typeof order.originalPrice === 'number' ? Number(order.originalPrice||0) : 0;
  const extra = typeof (order as any).extraCharge === 'number' ? Number((order as any).extraCharge||0) : 0;
  const effective = Math.max(0, base + extra);

  const doc = (
    <Document>
      <Page size={[W, H]} style={{ ...styles80.page, ...(font ? { fontFamily: font } : {}) }} wrap>
        <View style={styles80.center}>
          {logoSrc ? <Image src={logoSrc as any} style={{ width: 120, objectFit: 'contain', marginBottom: 4, alignSelf: 'center' as any }} /> : null}
          {stampUrl ? <Image src={stampUrl} style={{ width: 60, height: 60, marginBottom: 3, alignSelf: 'center' as any }} /> : null}
          <Text style={{ fontSize: 12, fontWeight: 700 }}>{storeName}</Text>
          {storePhone ? (
            <View style={{ width: '100%' as any, flexDirection: 'row-reverse' as any, justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ width: '46%' as any, alignItems: 'flex-end' as any }}>{LabelSplit('جوال', 'Phone')}</View>
              <View style={{ width: '54%' as any, alignItems: 'flex-start' as any }}>
                <Text style={{ direction: 'ltr' as any }}>{storePhone}</Text>
              </View>
            </View>
          ) : null}
          {storeAddress ? <Text>{storeAddress}</Text> : null}
        </View>
        <View style={styles80.sep} />
        {/* Collected date/time on a single centered line */}
        <View style={{ alignItems: 'center', marginBottom: 4 }}>
          <Text>{formatYMD_HM(order.collectedAt)}</Text>
        </View>
        {/* Meta table: رقم / العميل / الجوال (single-line rows) */}
        <View style={styles80.table}>
          <View style={styles80.tr}>
            <View style={styles80.th}>{LabelSplit('رقم', 'No.')}</View>
            <View style={styles80.td}><Text style={styles80.ltr}>{order.code}</Text></View>
          </View>
          <View style={styles80.tr}>
            <View style={styles80.th}>{LabelSplit('العميل', 'Customer')}</View>
            <View style={styles80.td}><Text>{order.customer.name}</Text></View>
          </View>
          <View style={styles80.tr}>
            <View style={styles80.th}>{LabelSplit('الجوال', 'Phone')}</View>
            <View style={styles80.td}><Text style={styles80.ltr}>{order.customer.phone}</Text></View>
          </View>
        </View>
        <View style={styles80.sep} />
        {/* Details table — single-line rows */}
        <View style={styles80.table}>
          <View style={styles80.tr}><View style={styles80.th}>{LabelSplit('الخدمة', 'Service')}</View><View style={styles80.td}><Text>{order.service}</Text></View></View>
          {order.deviceModel ? <View style={styles80.tr}><View style={styles80.th}>{LabelSplit('الجهاز', 'Device')}</View><View style={styles80.td}><Text>{order.deviceModel}</Text></View></View> : null}
          <View style={styles80.tr}><View style={styles80.th}>{LabelSplit('السعر الأصلي', 'Base Price')}</View><View style={styles80.td}><Text>{sar(base)}</Text></View></View>
          {extra>0 ? <View style={styles80.tr}><View style={styles80.th}>{LabelSplit('إضافات', 'Extra')}</View><View style={styles80.td}><Text>{sar(extra)}</Text></View></View> : null}
          <View style={styles80.tr}><View style={styles80.th}>{LabelSplit('الإجمالي قبل الخصم', 'Total before Disc.')}</View><View style={styles80.td}><Text>{sar(effective)}</Text></View></View>
          <View style={styles80.tr}><View style={styles80.th}>{LabelSplit('المبلغ المدفوع', 'Amount Paid')}</View><View style={styles80.td}><Text>{sar(order.collectedPrice)}</Text></View></View>
          <View style={styles80.tr}>
            <View style={styles80.th}>{LabelSplit('وسيلة الدفع', 'Payment')}</View>
            <View style={styles80.td}>
              {(() => {
                const m = (order as any).paymentMethod as ('CASH'|'TRANSFER'|undefined|null);
                if (!m) return <Text>—</Text>;
                if (receiptLang === 'AR_EN') return ValueSplit(m === 'CASH' ? 'نقدًا' : 'تحويل', m === 'CASH' ? 'Cash' : 'Transfer');
                return <Text>{m === 'CASH' ? 'نقدًا' : 'تحويل'}</Text>;
              })()}
            </View>
          </View>
        </View>
        <View style={styles80.sep} />
        {showQr && (
          <View style={{ alignItems: 'center' }}>
            <Image src={qrDataUrl} style={{ width: 80, height: 80 }} />
            <Text>{receiptLang==='AR_EN' ? `تتبع / Track: /track/${order.code}` : `/track/${order.code}`}</Text>
          </View>
        )}
        {receiptFooter ? (
          <View style={{ marginTop: 8 }}>
            <Text style={{ textAlign: 'center', fontSize: 9 }}>{receiptFooter}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
  return await renderToBuffer(doc);
}

// Thermal 80mm — Invoice-like layout without VAT fields
export async function generateThermalInvoicePdfNoVat(order: OrderInfo & { paymentMethod?: 'CASH'|'TRANSFER' }, qrDataUrl: string) {
  const s = await getSettings();
  const storeName = s?.storeName || storeConfig.storeName;
  const storeAddress = s?.storeAddress || storeConfig.storeAddress;
  const storePhone = (s as any)?.storePhone || '';
  const receiptFooter = s?.receiptFooter || '';
  const showQr = s?.receiptQrEnabled !== false;
  const stampUrl = s?.receiptStampUrl || undefined;
  const font = ensureArabicFont();
  const receiptLang = (s as any)?.receiptLang || 'AR';

  // Resolve logo as earlier
  let logoSrc: string | Uint8Array | undefined;
  try {
    const configuredLogo = (s as any)?.storeLogoUrl;
    if (configuredLogo && typeof configuredLogo === 'string') {
      if (/^https?:\/\//i.test(configuredLogo)) {
        logoSrc = configuredLogo;
      } else {
        const rel = configuredLogo.replace(/^\//, '');
        const p = path.join(process.cwd(), 'public', rel);
        if (fs.existsSync(p)) logoSrc = fs.readFileSync(p);
      }
    }
  } catch {}

  const W = 226.77; // 80mm
  const H = 800;
  const styles80 = StyleSheet.create({
    page: { padding: 10, fontSize: 9, direction: 'rtl' as any },
    center: { textAlign: 'center' as any, alignItems: 'center' as any },
    sep: { marginVertical: 4, borderBottomWidth: 1, borderBottomColor: '#ddd' },
    row: { flexDirection: 'row-reverse' as any, justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
    small: { fontSize: 8, color: '#555' },
    tblHeader: { flexDirection: 'row-reverse' as any, borderBottomWidth: 1, borderBottomColor: '#000', paddingVertical: 3, marginTop: 2 },
    tblRow: { flexDirection: 'row-reverse' as any, paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: '#eee' },
    cDesc: { width: '44%' as any },
    cQty: { width: '12%' as any, textAlign: 'center' as any },
    cPrice: { width: '20%' as any, textAlign: 'left' as any },
    cTotal: { width: '24%' as any, textAlign: 'left' as any },
    ltr: { direction: 'ltr' as any, textAlign: 'left' as any },
  });

  const sarSymbol = (font ? ' ﷼' : ' ر.س');
  const sar = (n: number) => `${Number(n).toFixed(2)}${sarSymbol}`;
  const L = (ar: string, en: string) => (receiptLang === 'AR_EN' ? `${ar} / ${en}` : ar);

  const base = typeof order.originalPrice === 'number' ? Number(order.originalPrice || 0) : 0;
  const extra = typeof (order as any).extraCharge === 'number' ? Number((order as any).extraCharge || 0) : 0;
  const effective = Math.max(0, base + extra);
  const discount = Math.max(0, effective - Number(order.collectedPrice || 0));

  const doc = (
    <Document>
      <Page size={[W, H]} style={{ ...styles80.page, ...(font ? { fontFamily: font } : {}) }} wrap>
        <View style={styles80.center}>
          {logoSrc ? <Image src={logoSrc as any} style={{ width: 120, objectFit: 'contain', marginBottom: 4 }} /> : null}
          <Text style={{ fontSize: 12, fontWeight: 700 }}>{L('فاتورة', 'Invoice')}</Text>
          <Text>{storeName}</Text>
          {storePhone ? <Text>{L('جوال', 'Phone')}: {storePhone}</Text> : null}
          {storeAddress ? <Text>{storeAddress}</Text> : null}
        </View>

        <View style={styles80.sep} />

        {/* Invoice meta */}
        <View style={styles80.row}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
            <Text>{L('رقم', 'No.')}</Text>
            <Text>: </Text>
            <Text style={styles80.ltr}>{order.code}</Text>
          </View>
          <Text>{formatYMD_HM(order.collectedAt)}</Text>
        </View>
        <View style={styles80.row}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
            <Text>{L('العميل', 'Customer')}</Text>
            <Text>: </Text>
            <Text>{order.customer.name}</Text>
          </View>
          <Text style={styles80.ltr}>{order.customer.phone}</Text>
        </View>
        {/* Payment row moved to details table below for consistent bilingual layout */}

        <View style={styles80.sep} />

        {/* Items table */}
        <View style={styles80.tblHeader}>
          <Text style={styles80.cDesc}>{L('الوصف', 'Description')}</Text>
          <Text style={styles80.cQty}>{L('الكمية', 'Qty')}</Text>
          <Text style={styles80.cPrice}>{L('السعر', 'Price')}</Text>
          <Text style={styles80.cTotal}>{L('الإجمالي', 'Total')}</Text>
        </View>
        <View style={styles80.tblRow}>
          <Text style={styles80.cDesc}>{order.service}</Text>
          <Text style={styles80.cQty}>1</Text>
          <Text style={styles80.cPrice}>{sar(base)}</Text>
          <Text style={styles80.cTotal}>{sar(base)}</Text>
        </View>
        {extra > 0 ? (
          <View style={styles80.tblRow}>
            <Text style={styles80.cDesc}>{L('إضافات', 'Extra')}{(order as any).extraReason ? ` (${(order as any).extraReason})` : ''}</Text>
            <Text style={styles80.cQty}>1</Text>
            <Text style={styles80.cPrice}>{sar(extra)}</Text>
            <Text style={styles80.cTotal}>{sar(extra)}</Text>
          </View>
        ) : null}
        {discount > 0 ? (
          <View style={styles80.tblRow}>
            <Text style={styles80.cDesc}>{L('خصم', 'Discount')}</Text>
            <Text style={styles80.cQty}>1</Text>
            <Text style={styles80.cPrice}>-{sar(discount)}</Text>
            <Text style={styles80.cTotal}>-{sar(discount)}</Text>
          </View>
        ) : null}

        {/* Totals */}
        <View style={{ marginTop: 6 }} />
        <View style={styles80.row}><Text>{L('المجموع', 'Subtotal')}</Text><Text>{sar(effective)}</Text></View>
        <View style={styles80.row}><Text>{L('المبلغ المدفوع', 'Amount Paid')}</Text><Text>{sar(Number(order.collectedPrice || 0))}</Text></View>
        {/* Payment method row (always visible) */}
        <View style={styles80.row}>
          <View style={{ width: '46%' as any, alignItems: 'flex-end' as any }}>{/* label */}
            {receiptLang === 'AR_EN' ? (
              <View style={{ flexDirection: 'row-reverse' as any, justifyContent: 'space-between', width: '100%' as any }}>
                <Text>وسيلة الدفع</Text>
                <Text style={{ fontSize: 7, direction: 'ltr' as any, textAlign: 'left' as any, color: '#666' }}>Payment</Text>
              </View>
            ) : (
              <Text>وسيلة الدفع</Text>
            )}
          </View>
          <View style={{ width: '54%' as any, alignItems: 'flex-start' as any }}>{/* value */}
            {(() => {
              const m = (order as any).paymentMethod as ('CASH'|'TRANSFER'|undefined|null);
              if (!m) return <Text>—</Text>;
              if (receiptLang === 'AR_EN') {
                return (
                  <View style={{ flexDirection: 'row-reverse' as any, justifyContent: 'space-between', width: '100%' as any }}>
                    <Text>{m === 'CASH' ? 'نقدًا' : 'تحويل'}</Text>
                    <Text style={{ direction: 'ltr' as any, textAlign: 'left' as any }}>{m === 'CASH' ? 'Cash' : 'Transfer'}</Text>
                  </View>
                );
              }
              return <Text>{m === 'CASH' ? 'نقدًا' : 'تحويل'}</Text>;
            })()}
          </View>
        </View>

        <View style={styles80.sep} />
        {showQr && (
          <View style={{ alignItems: 'center' }}>
            <Image src={qrDataUrl} style={{ width: 80, height: 80 }} />
            <Text>{receiptLang==='AR_EN' ? `تتبع / Track: /track/${order.code}` : `/track/${order.code}`}</Text>
          </View>
        )}
        {receiptFooter ? (
          <View style={{ marginTop: 8 }}>
            <Text style={{ textAlign: 'center', fontSize: 9 }}>{receiptFooter}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
  return await renderToBuffer(doc);
}
