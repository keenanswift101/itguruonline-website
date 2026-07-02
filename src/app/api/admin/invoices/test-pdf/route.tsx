import { requireAdmin } from "@/lib/auth";
import { renderToBuffer, Document, Page, Text } from "@react-pdf/renderer";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const buffer = await renderToBuffer(
    <Document>
      <Page>
        <Text>Hello Invoice PDF</Text>
      </Page>
    </Document>
  );

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "private, no-store",
    },
  });
}
