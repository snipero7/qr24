import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, renderToBuffer, Font } from "@react-pdf/renderer";
import fs from "node:fs";
import path from "node:path";
import { storeConfig } from "@/config/notifications";
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
  const font = ensureArabicFont();
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
        <Text style={styles.subheader}>{storeConfig.storeName} — {storeConfig.storeAddress}</Text>
        <View style={styles.box}>
          <View style={styles.row}>
            <Text style={styles.label}>كود الطلب:</Text>
            <Text>{order.code}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>العميل:</Text>
            <Text>{order.customer.name} ({order.customer.phone})</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>الخدمة:</Text>
            <Text>{order.service}</Text>
          </View>
          {order.deviceModel && (
            <View style={styles.row}>
              <Text style={styles.label}>الجهاز:</Text>
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
                  <Text style={styles.label}>السعر الأساسي:</Text>
                  <Text>{formatSAR(base)}</Text>
                </View>
                {extra > 0 ? (
                  <View style={styles.row}>
                    <Text style={styles.label}>رسوم إضافية{order.extraReason ? ` (${order.extraReason})` : ''}:</Text>
                    <Text>{formatSAR(extra)}</Text>
                  </View>
                ) : null}
                <View style={styles.row}>
                  <Text style={styles.label}>الإجمالي قبل الخصم:</Text>
                  <Text>{formatSAR(effective)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>الخصم:</Text>
                  <Text>{formatSAR(discount)}</Text>
                </View>
              </>
            );
          })()}
          <View style={styles.row}>
            <Text style={styles.label}>المبلغ بعد الخصم:</Text>
            <Text>{formatSAR(order.collectedPrice)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>تاريخ التسليم:</Text>
            <Text>{formatDate(order.collectedAt)}</Text>
          </View>
        </View>
        <View style={{ marginTop: 16, alignItems: "center" }}>
          <Image style={styles.qr} src={qrDataUrl} />
          <Text>للتتبع: /track/{order.code}</Text>
        </View>
      </Page>
    </Document>
  );

  const buffer = await renderToBuffer(doc);
  return buffer;
}
