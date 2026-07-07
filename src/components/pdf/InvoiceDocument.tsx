import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import { formatInvoiceNumber } from "@/lib/invoices";
import { styles, formatRands } from "@/components/pdf/pdf-shared";
import { getLogoDataUri } from "@/components/pdf/pdf-logo";

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

export function InvoiceDocument({ invoice, lineItems }: InvoiceDocumentProps) {
  const heading = invoice.status === "draft" ? "Draft Invoice" : "Invoice";
  const number = formatInvoiceNumber(invoice.fiscalYear, invoice.sequenceNumber);
  const logoSrc = getLogoDataUri();

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
            {logoSrc ? (
              <Image src={logoSrc} style={styles.logo} />
            ) : (
              <Text style={styles.companyName}>IT-Guru Online</Text>
            )}
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
