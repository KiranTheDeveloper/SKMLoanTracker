import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createReminderSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().or(z.literal("")),
  dueDate: z.string().min(1, "Due date is required"),
  applicationId: z.string().optional().or(z.literal("")),
  userId: z.string().optional().or(z.literal("")),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || session.user.id;
  const period = searchParams.get("period") || "all";

  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  let dateFilter = {};
  if (period === "overdue") dateFilter = { dueDate: { lt: now } };
  else if (period === "today") dateFilter = { dueDate: { gte: now, lte: todayEnd } };
  else if (period === "upcoming") dateFilter = { dueDate: { gt: todayEnd } };

  const reminders = await prisma.reminder.findMany({
    where: {
      userId,
      isCompleted: false,
      ...dateFilter,
    },
    include: {
      application: {
        include: {
          customer: { select: { name: true, phone: true } },
          loanProduct: { select: { name: true } },
        },
      },
      user: { select: { name: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(reminders);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = createReminderSchema.parse(body);

    const reminder = await prisma.reminder.create({
      data: {
        title: data.title,
        description: data.description || null,
        dueDate: new Date(data.dueDate),
        applicationId: data.applicationId || null,
        userId: data.userId || session.user.id,
      },
    });

    return NextResponse.json(reminder, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create reminder" }, { status: 500 });
  }
}
