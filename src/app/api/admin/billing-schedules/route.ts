import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { billingSchedules, hostingPackages } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

// GET — list all billing schedules joined with package name
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schedules = await db
    .select({
      id: billingSchedules.id,
      clientName: billingSchedules.clientName,
      clientEmail: billingSchedules.clientEmail,
      packageId: billingSchedules.packageId,
      packageName: hostingPackages.name,
      packagePriceRands: hostingPackages.priceRands,
      billingStart: billingSchedules.billingStart,
      cycle: billingSchedules.cycle,
      isActive: billingSchedules.isActive,
      createdAt: billingSchedules.createdAt,
    })
    .from(billingSchedules)
    .leftJoin(hostingPackages, eq(billingSchedules.packageId, hostingPackages.id))
    .orderBy(desc(billingSchedules.createdAt));

  return NextResponse.json({ schedules });
}

const CreateSchema = z.object({
  clientName: z.string().min(1).max(128),
  clientEmail: z.string().email().optional().or(z.literal("")),
  packageId: z.number().int().positive().optional(),
  billingStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cycle: z.literal("monthly").default("monthly"),
});

// POST — create new billing schedule
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = CreateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { clientName, clientEmail, packageId, billingStart, cycle } = parsed.data;

  // Unknown packageId would otherwise surface as a raw FK violation (500);
  // reject it as a validation error instead.
  if (packageId !== undefined) {
    const [pkg] = await db
      .select({ id: hostingPackages.id })
      .from(hostingPackages)
      .where(eq(hostingPackages.id, packageId));
    if (!pkg) {
      return NextResponse.json(
        { error: "Validation failed", fields: { packageId: ["Unknown package"] } },
        { status: 422 }
      );
    }
  }

  const [newSchedule] = await db
    .insert(billingSchedules)
    .values({
      clientName,
      clientEmail: clientEmail || null,
      packageId: packageId ?? null,
      billingStart,
      cycle,
      isActive: true,
    })
    .returning();

  return NextResponse.json({ schedule: newSchedule }, { status: 201 });
}
