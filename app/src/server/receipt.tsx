import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, pdf } from "@react-pdf/renderer";

type OrderInfo = {
  code: string;
  service: string;
  deviceModel?: string | null;
  collectedPrice: number;
  collectedAt: Date;
  customer: { name: string; phone: string };
};

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 12 },
  header: { fontSize: 16, marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { color: "#555" },
  box: { borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 6, marginTop: 8 },
  qr: { width: 120, height: 120 },
});

export async function generateReceiptPdf(order: OrderInfo, qrDataUrl: string) {
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Receipt - Mobile Repair</Text>
        <View style={styles.box}>
          <View style={styles.row}>
            <Text style={styles.label}>Order Code:</Text>
            <Text>{order.code}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Customer:</Text>
            <Text>{order.customer.name} ({order.customer.phone})</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Service:</Text>
            <Text>{order.service}</Text>
          </View>
          {order.deviceModel && (
            <View style={styles.row}>
              <Text style={styles.label}>Device:</Text>
              <Text>{order.deviceModel}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Collected:</Text>
            <Text>{order.collectedPrice.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Delivered At:</Text>
            <Text>{order.collectedAt.toISOString()}</Text>
          </View>
        </View>
        <View style={{ marginTop: 16, alignItems: "center" }}>
          <Image style={styles.qr} src={qrDataUrl} />
          <Text>Scan to track: /track/{order.code}</Text>
        </View>
      </Page>
    </Document>
  );

  const instance = pdf(doc);
  const buffer = await instance.toBuffer();
  return Buffer.from(buffer);
}

