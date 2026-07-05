import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles, formatRands } from "@/components/pdf/pdf-shared";
import { formatQuotationNumber } from "@/lib/quotations";

/**
 * Server-only react-pdf quotation document (QUOTE-03/QUOTE-06). Structural
 * sibling of InvoiceDocument — shares styles/formatRands via pdf-shared.ts
 * but differs meaningfully: no PAID stamp, no invoice number, a Valid Until
 * date instead of Due Date, and a validity/terms footer instead of bank/EFT
 * details (a quotation is a proposal, not yet a request for payment).
 */

export interface QuotationPdfQuotation {
  id: number;
  clientName: string;
  clientEmail: string | null;
  billingAddress: string | null;
  issueDate: string; // YYYY-MM-DD
  validUntil: string; // YYYY-MM-DD
  status: string; // 'draft' | 'sent' | 'accepted' | 'declined'
  totalRands: number;
}

export interface QuotationPdfLineItem {
  description: string;
  quantity: number;
  unitPriceRands: number;
  lineTotalRands: number;
}

export interface QuotationDocumentProps {
  quotation: QuotationPdfQuotation;
  lineItems: QuotationPdfLineItem[];
}

export function QuotationDocument({ quotation, lineItems }: QuotationDocumentProps) {
  const heading = quotation.status === "draft" ? "Draft Quotation" : "Quotation";
  const reference = formatQuotationNumber(quotation.id);

  return (
    <Document title={`${heading} ${reference}`} author="IT-Guru Online">
      <Page size="A4" style={styles.page}>
        {/* Header: heading + reference left, company identity right */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.heading}>{heading}</Text>
            <Text style={styles.invoiceNumber}>{reference}</Text>
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
            <Text style={styles.clientName}>{quotation.clientName}</Text>
            {quotation.clientEmail ? (
              <Text style={styles.clientLine}>{quotation.clientEmail}</Text>
            ) : null}
            {quotation.billingAddress
              ? quotation.billingAddress
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
              <Text style={styles.dateValue}>{quotation.issueDate}</Text>
            </View>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Valid Until</Text>
              <Text style={styles.dateValue}>{quotation.validUntil}</Text>
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

        {/* Total — plain total only, no tax breakdown (not VAT-registered) */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatRands(quotation.totalRands)}</Text>
        </View>

        {/* Footer: validity/terms — NOT bank/EFT details (quotation isn't a payment request yet) */}
        <View style={styles.footer}>
          <Text style={styles.footerHeading}>Validity</Text>
          <Text style={styles.clientLine}>
            This quotation is valid until {quotation.validUntil}. All prices are in South African Rand (ZAR).
          </Text>
          <Text style={styles.clientLine}>
            This is a quotation, not a tax invoice — an invoice will be issued on acceptance.
          </Text>
          <Text style={styles.thanks}>Thank you for the opportunity.</Text>
        </View>
      </Page>
    </Document>
  );
}
