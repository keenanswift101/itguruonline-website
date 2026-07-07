import { readFileSync } from "fs";
import path from "path";

/**
 * Server-only: read the brand logo once and expose it as a base64 data URI
 * for @react-pdf's <Image src>. Cached at module scope so the file is read a
 * single time per server instance. Only ever imported by the PDF document
 * components, which render exclusively server-side via renderToBuffer — never
 * in the client bundle. Returns "" on failure so a missing file degrades to
 * "no logo" rather than crashing PDF generation.
 */
let cached: string | null = null;

export function getLogoDataUri(): string {
  if (cached !== null) return cached;
  try {
    const file = readFileSync(
      path.join(process.cwd(), "public", "FullLogo_Transparent.png")
    );
    cached = `data:image/png;base64,${file.toString("base64")}`;
  } catch {
    cached = "";
  }
  return cached;
}
