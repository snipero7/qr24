import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, renderToBuffer, Font } from "@react-pdf/renderer";
import fs from "node:fs";
import path from "node:path";
import { storeConfig } from "@/config/notifications";

type OrderInfo = {
  code: string;
  service: string;
  deviceModel?: string | null;
  collectedPrice: number;
  collectedAt: Date;
  customer: { name: string; phone: string };
};

let fontRegistered = false;
function ensureArabicFont() {
  if (fontRegistered) return;
  // حاول استخدام خطوط محلية إن وُجدت، وإلا استخدم النظام الافتراضي
  try {
    const fontsDir = path.join(process.cwd(), "public", "fonts");
    const regular = path.join(fontsDir, "Cairo-Regular.ttf");
    const bold = path.join(fontsDir, "Cairo-Bold.ttf");
    if (fs.existsSync(regular)) {
      Font.register({
        family: "Cairo",
        fonts: [
          { src: regular, fontWeight: "normal" },
          fs.existsSync(bold) ? { src: bold, fontWeight: "bold" } : undefined,
        ].filter(Boolean) as any,
      });
    }
  } catch {}
  fontRegistered = true;
}

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 12, direction: "rtl" as any, fontFamily: "Cairo" },
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

function formatDate(d: Date) {
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      dateStyle: "medium",
      timeStyle: "short",
      hour12: true,
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

export async function generateReceiptPdf(order: OrderInfo, qrDataUrl: string) {
  ensureArabicFont();
  const hasLogo = !!process.env.NEXT_PUBLIC_STORE_LOGO;
  const logoPath = process.env.NEXT_PUBLIC_STORE_LOGO
    ? path.isAbsolute(process.env.NEXT_PUBLIC_STORE_LOGO)
      ? process.env.NEXT_PUBLIC_STORE_LOGO
      : path.join(process.cwd(), "public", process.env.NEXT_PUBLIC_STORE_LOGO)
    : undefined;

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
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
          <View style={styles.row}>
            <Text style={styles.label}>المبلغ المُحصَّل:</Text>
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
