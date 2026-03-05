import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateApplicationSchema = z.object({
  requestedAmount: z.coerce.number().optional().nullable(),
  approvedAmount: z.coerce.number().optional().nullable(),
  tenure: z.coerce.number().optional().nullable(),
  interestRate: z.coerce.number().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  notes: z.string().optional().or(z.literal("")),
  rejectionReason: z.string().optional().or(z.literal("")),
  assignedToId: z.string().optional().or(z.literal("")),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      customer: true,
      loanProduct: true,
      createdBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
      statusHistory: {
        include: { changedBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      reminders: {
        include: { user: { select: { name: true } } },
        orderBy: { dueDate: "asc" },
      },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  return NextResponse.json(application);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateApplicationSchema.parse(body);

    const application = await prisma.application.update({
      where: { id },
      data: {
        ...(data.requestedAmount !== undefined && { requestedAmount: data.requestedAmount }),
        ...(data.approvedAmount !== undefined && { approvedAmount: data.approvedAmount }),
        ...(data.tenure !== undefined && { tenure: data.tenure }),
        ...(data.interestRate !== undefined && { interestRate: data.interestRate }),
        ...(data.priority && { priority: data.priority }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        ...(data.rejectionReason !== undefined && { rejectionReason: data.rejectionReason || null }),
        ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId || null }),
      },
    });

    return NextResponse.json(application);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.application.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
