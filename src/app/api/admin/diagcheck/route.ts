import { NextResponse } from "next/server";

function safeShape(url: string | undefined): unknown {
  if (!url) return null;
  try {
    const u = new URL(url);
    return {
      protocol: u.protocol,
      host: u.hostname,
      port: u.port || null,
      pathname: u.pathname,
      search: u.search,
      hasUser: !!u.username,
      hasPassword: !!u.password,
      length: url.length,
    };
  } catch {
    return { unparseable: true, length: url.length, prefix: url.slice(0, 15) };
  }
}

export async function GET() {
  return NextResponse.json({
    NETLIFY_DB_URL: safeShape(process.env.NETLIFY_DB_URL),
    NETLIFY_DATABASE_URL: safeShape(process.env.NETLIFY_DATABASE_URL),
    NETLIFY_DB_DRIVER: process.env.NETLIFY_DB_DRIVER ?? null,
  });
}
