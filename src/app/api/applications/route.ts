import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createApplicationSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  loanProductId: z.string().min(1, "Loan product is required"),
  requestedAmount: z.coerce.number().optional(),
  tenure: z.coerce.number().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  notes: z.string().optional().or(z.literal("")),
  assignedToId: z.string().optional().or(z.literal("")),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const loanProductId = searchParams.get("loanProductId") || "";
  const assignedToId = searchParams.get("assignedToId") || "";
  const priority = searchParams.get("priority") || "";

  const applications = await prisma.application.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { customer: { name: { contains: search, mode: "insensitive" } } },
                { customer: { phone: { contains: search } } },
                { customer: { panNo: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {},
        status ? { status: status as any } : {},
        loanProductId ? { loanProductId } : {},
        assignedToId ? { assignedToId } : {},
        priority ? { priority: priority as any } : {},
      ],
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      loanProduct: true,
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { name: true } },
      _count: { select: { reminders: true, documents: true } },
    },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json(applications);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = createApplicationSchema.parse(body);

    const application = await prisma.application.create({
      data: {
        customerId: data.customerId,
        loanProductId: data.loanProductId,
        requestedAmount: data.requestedAmount ?? null,
        tenure: data.tenure ?? null,
        priority: data.priority,
        notes: data.notes || null,
        createdById: session.user.id,
        assignedToId: data.assignedToId || null,
        statusHistory: {
          create: {
            status: "NEW_LEAD",
            notes: "Application created",
            changedById: session.user.id,
          },
        },
      },
      include: { customer: true, loanProduct: true },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create application" }, { status: 500 });
  }
}
