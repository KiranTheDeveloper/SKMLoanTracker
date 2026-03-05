import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(10).optional(),
  altPhone: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  pincode: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  occupation: z.string().optional().or(z.literal("")),
  employerName: z.string().optional().or(z.literal("")),
  monthlyIncome: z.coerce.number().optional().nullable(),
  aadhaarNo: z.string().optional().or(z.literal("")),
  panNo: z.string().optional().or(z.literal("")),
  dob: z.string().optional().or(z.literal("")),
  gender: z.string().optional().or(z.literal("")),
  bankName: z.string().optional().or(z.literal("")),
  bankAccountNo: z.string().optional().or(z.literal("")),
  ifscCode: z.string().optional().or(z.literal("")),
  gstNo: z.string().optional().or(z.literal("")),
  assignedToId: z.string().optional().or(z.literal("")),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
      applications: {
        include: {
          loanProduct: true,
          assignedTo: { select: { name: true } },
          _count: { select: { reminders: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateCustomerSchema.parse(body);

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.phone && { phone: data.phone }),
        altPhone: data.altPhone !== undefined ? (data.altPhone || null) : undefined,
        email: data.email !== undefined ? (data.email || null) : undefined,
        city: data.city !== undefined ? (data.city || null) : undefined,
        state: data.state !== undefined ? (data.state || null) : undefined,
        pincode: data.pincode !== undefined ? (data.pincode || null) : undefined,
        address: data.address !== undefined ? (data.address || null) : undefined,
        occupation: data.occupation !== undefined ? (data.occupation || null) : undefined,
        employerName: data.employerName !== undefined ? (data.employerName || null) : undefined,
        monthlyIncome: data.monthlyIncome !== undefined ? data.monthlyIncome : undefined,
        aadhaarNo: data.aadhaarNo !== undefined ? (data.aadhaarNo || null) : undefined,
        panNo: data.panNo !== undefined ? (data.panNo || null) : undefined,
        dob: data.dob !== undefined ? (data.dob || null) : undefined,
        gender: data.gender !== undefined ? (data.gender || null) : undefined,
        bankName: data.bankName !== undefined ? (data.bankName || null) : undefined,
        bankAccountNo: data.bankAccountNo !== undefined ? (data.bankAccountNo || null) : undefined,
        ifscCode: data.ifscCode !== undefined ? (data.ifscCode || null) : undefined,
        gstNo: data.gstNo !== undefined ? (data.gstNo || null) : undefined,
        assignedToId: data.assignedToId !== undefined ? (data.assignedToId || null) : undefined,
      },
    });

    return NextResponse.json(customer);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
