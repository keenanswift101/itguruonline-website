import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatInvoiceNumber } from "@/lib/invoices";

/**
 * Server-only react-pdf invoice document (D-01). Rendered exclusively via
 * renderToBuffer in the PDF route handler — never imported client-side.
 *
 * SARS compliance (D-05, non-negotiable): the heading is "Invoice" (sent/paid)
 * or "Draft Invoice" (draft) — never any other invoice designation. IT-Guru is
 * not registered for value-added tax, so no tax wording or tax breakdown
 * lines may ever appear on this document.
 */

export interface InvoicePdfInvoice {
  clientName: string;
  clientEmail: string | null;
  billingAddress: string | null;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status: string; // 'draft' | 'sent' | 'paid'
  fiscalYear: number | null;
  sequenceNumber: number | null;
  totalRands: number;
}

export interface InvoicePdfLineItem {
  description: string;
  quantity: number;
  unitPriceRands: number;
  lineTotalRands: number;
}

export interface InvoiceDocumentProps {
  invoice: InvoicePdfInvoice;
  lineItems: InvoicePdfLineItem[];
}

// Static EFT banking details — hardcoded per phase context (no DB). Two
// accounts are offered so the client can pay via whichever bank is more
// convenient for them.
const BANK_OPTIONS: Array<{ option: string; rows: Array<[string, string]> }> = [
  {
    option: "Option 1",
    rows: [
      ["Name", "A.P Isaacs"],
      ["Bank", "Discovery Bank"],
      ["Account Number", "124 194 760 24"],
      ["Branch Code", "679 000"],
    ],
  },
  {
    option: "Option 2",
    rows: [
      ["Name", "A.P Isaacs"],
      ["Bank", "First National Bank"],
      ["Account Number", "628 048 039 81"],
      ["Branch Code", "250 655"],
    ],
  },
];

const NAVY = "#0a1633";
const COBALT = "#00aaff";
const MUTED = "#5b6478";
const BORDER = "#d7dce5";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: NAVY,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  heading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 26,
    color: NAVY,
  },
  invoiceNumber: {
    marginTop: 6,
    fontSize: 11,
    color: MUTED,
  },
  paidStamp: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderWidth: 2,
    borderColor: "#16a34a",
    color: "#16a34a",
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 3,
  },
  companyBlock: {
    alignItems: "flex-end",
  },
  companyName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: NAVY,
  },
  companyMeta: {
    marginTop: 3,
    fontSize: 9,
    color: MUTED,
  },
  rule: {
    height: 2,
    backgroundColor: COBALT,
    marginTop: 14,
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 26,
  },
  blockLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: MUTED,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  clientName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    marginBottom: 3,
  },
  clientLine: {
    fontSize: 10,
    color: MUTED,
    marginBottom: 2,
  },
  dateBlock: {
    alignItems: "flex-end",
  },
  dateRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  dateLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: MUTED,
    marginRight: 8,
  },
  dateValue: {
    fontSize: 10,
    color: NAVY,
  },
  table: {
    flexDirection: "column",
    width: "100%",
    marginBottom: 14,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: NAVY,
    borderRadius: 2,
  },
  th: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#ffffff",
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  td: {
    fontSize: 10,
    paddingVertical: 7,
    paddingHorizontal: 8,
    color: NAVY,
  },
  colDescription: { flex: 6 },
  colQty: { flex: 1, textAlign: "right" },
  colUnit: { flex: 2, textAlign: "right" },
  colTotal: { flex: 2, textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 4,
  },
  totalLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    marginRight: 16,
  },
  totalValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: NAVY,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 14,
  },
  footerHeading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: MUTED,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  bankOptionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bankOption: {
    width: "48%",
  },
  bankOptionLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: COBALT,
    marginBottom: 3,
  },
  bankRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bankLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: MUTED,
    width: 90,
  },
  bankValue: {
    fontSize: 9,
    color: NAVY,
  },
  thanks: {
    marginTop: 12,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COBALT,
  },
});

function formatRands(rands: number): string {
  return `R ${rands.toFixed(2)}`;
}

export function InvoiceDocument({ invoice, lineItems }: InvoiceDocumentProps) {
  const heading = invoice.status === "draft" ? "Draft Invoice" : "Invoice";
  const number = formatInvoiceNumber(invoice.fiscalYear, invoice.sequenceNumber);

  return (
    <Document title={`${heading} ${number}`} author="IT-Guru Online">
      <Page size="A4" style={styles.page}>
        {/* Header: heading + number left, company identity right */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.heading}>{heading}</Text>
            <Text style={styles.invoiceNumber}>{number}</Text>
            {invoice.status === "paid" ? (
              <Text style={styles.paidStamp}>PAID</Text>
            ) : null}
          </View>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>IT-Guru Online</Text>
            <Text style={styles.companyMeta}>Kuils River, South Africa</Text>
            <Text style={styles.companyMeta}>https://it-guru.co.za</Text>
          </View>
        </View>

        <View style={styles.rule} />

        {/* Client block left, dates right */}
        <View style={styles.metaRow}>
          <View>
            <Text style={styles.blockLabel}>Billed To</Text>
            <Text style={styles.clientName}>{invoice.clientName}</Text>
            {invoice.clientEmail ? (
              <Text style={styles.clientLine}>{invoice.clientEmail}</Text>
            ) : null}
            {invoice.billingAddress
              ? invoice.billingAddress
                  .split("\n")
                  .map((line, idx) => (
                    <Text key={idx} style={styles.clientLine}>
                      {line}
                    </Text>
                  ))
              : null}
          </View>
          <View style={styles.dateBlock}>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Issue Date</Text>
              <Text style={styles.dateValue}>{invoice.issueDate}</Text>
            </View>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Due Date</Text>
              <Text style={styles.dateValue}>{invoice.dueDate}</Text>
            </View>
          </View>
        </View>

        {/* Line items table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colDescription]}>Description</Text>
            <Text style={[styles.th, styles.colQty]}>Qty</Text>
            <Text style={[styles.th, styles.colUnit]}>Unit Price</Text>
            <Text style={[styles.th, styles.colTotal]}>Line Total</Text>
          </View>
          {lineItems.map((item, idx) => (
            <View key={idx} style={styles.tr}>
              <Text style={[styles.td, styles.colDescription]}>
                {item.description}
              </Text>
              <Text style={[styles.td, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.td, styles.colUnit]}>
                {formatRands(item.unitPriceRands)}
              </Text>
              <Text style={[styles.td, styles.colTotal]}>
                {formatRands(item.lineTotalRands)}
              </Text>
            </View>
          ))}
        </View>

        {/* Total — plain total only, no tax breakdown (D-05) */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatRands(invoice.totalRands)}</Text>
        </View>

        {/* Footer: EFT banking details + sign-off */}
        <View style={styles.footer}>
          <Text style={styles.footerHeading}>Payment via EFT</Text>
          <View style={styles.bankOptionsRow}>
            {BANK_OPTIONS.map(({ option, rows }) => (
              <View key={option} style={styles.bankOption}>
                <Text style={styles.bankOptionLabel}>{option}</Text>
                {rows.map(([label, value]) => (
                  <View key={label} style={styles.bankRow}>
                    <Text style={styles.bankLabel}>{label}</Text>
                    <Text style={styles.bankValue}>{value}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
          <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>Reference</Text>
            <Text style={styles.bankValue}>{number}</Text>
          </View>
          <Text style={styles.thanks}>Thank you for your business.</Text>
        </View>
      </Page>
    </Document>
  );
}
