import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Valid phone required"),
  altPhone: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  pincode: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  occupation: z.string().optional().or(z.literal("")),
  employerName: z.string().optional().or(z.literal("")),
  monthlyIncome: z.coerce.number().optional(),
  aadhaarNo: z.string().optional().or(z.literal("")),
  panNo: z.string().optional().or(z.literal("")),
  dob: z.string().optional().or(z.literal("")),
  gender: z.string().optional().or(z.literal("")),
  assignedToId: z.string().optional().or(z.literal("")),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const assignedToId = searchParams.get("assignedToId") || "";

  const customers = await prisma.customer.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search } },
                { email: { contains: search, mode: "insensitive" } },
                { aadhaarNo: { contains: search } },
                { panNo: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        assignedToId ? { assignedToId } : {},
      ],
    },
    include: {
      createdBy: { select: { name: true } },
      assignedTo: { select: { name: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = createCustomerSchema.parse(body);

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        altPhone: data.altPhone || null,
        email: data.email || null,
        city: data.city || null,
        state: data.state || null,
        pincode: data.pincode || null,
        address: data.address || null,
        occupation: data.occupation || null,
        employerName: data.employerName || null,
        monthlyIncome: data.monthlyIncome ?? null,
        aadhaarNo: data.aadhaarNo || null,
        panNo: data.panNo || null,
        dob: data.dob || null,
        gender: data.gender || null,
        createdById: session.user.id,
        assignedToId: data.assignedToId || null,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
