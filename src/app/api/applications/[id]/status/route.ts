import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const statusUpdateSchema = z.object({
  status: z.string().min(1),
  notes: z.string().optional().or(z.literal("")),
  reminderTitle: z.string().optional().or(z.literal("")),
  reminderDate: z.string().optional().or(z.literal("")),
  reminderDescription: z.string().optional().or(z.literal("")),
  approvedAmount: z.coerce.number().optional(),
  rejectionReason: z.string().optional().or(z.literal("")),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const data = statusUpdateSchema.parse(body);

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: data.status as any,
        ...(data.approvedAmount !== undefined && { approvedAmount: data.approvedAmount }),
        ...(data.rejectionReason && { rejectionReason: data.rejectionReason }),
        statusHistory: {
          create: {
            status: data.status as any,
            notes: data.notes || null,
            changedById: session.user.id,
          },
        },
        ...(data.reminderDate && data.reminderTitle
          ? {
              reminders: {
                create: {
                  title: data.reminderTitle,
                  description: data.reminderDescription || null,
                  dueDate: new Date(data.reminderDate),
                  userId: session.user.id,
                },
              },
            }
          : {}),
      },
      include: {
        customer: true,
        loanProduct: true,
        statusHistory: {
          include: { changedBy: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
        reminders: { where: { isCompleted: false }, orderBy: { dueDate: "asc" } },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
