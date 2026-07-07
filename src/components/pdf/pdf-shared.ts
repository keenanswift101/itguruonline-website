import { StyleSheet } from "@react-pdf/renderer";

/**
 * Shared react-pdf StyleSheet + formatRands, imported verbatim by both
 * InvoiceDocument and QuotationDocument so the two documents' page/header/
 * table/footer styling can never drift apart. Per Pitfall 6 (10-RESEARCH.md):
 * import the ENTIRE styles object as-is — never spread/merge individual
 * style keys, only vary which JSX elements are rendered.
 */

export const NAVY = "#0a1633";
export const COBALT = "#00aaff";
export const MUTED = "#5b6478";
export const BORDER = "#d7dce5";

export const styles = StyleSheet.create({
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
  logo: {
    width: 150,
    marginBottom: 8,
    objectFit: "contain",
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

export function formatRands(rands: number): string {
  return `R ${rands.toFixed(2)}`;
}
