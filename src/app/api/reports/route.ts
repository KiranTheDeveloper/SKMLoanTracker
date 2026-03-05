import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "monthly";

  const now = new Date();
  let startDate: Date;

  if (period === "daily") {
    startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "weekly") {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const [
    totalApplications,
    newLeads,
    approved,
    disbursed,
    rejected,
    applicationsByProduct,
    applicationsByStatus,
    teamStats,
    recentActivity,
  ] = await Promise.all([
    // Total applications in period
    prisma.application.count({ where: { createdAt: { gte: startDate } } }),

    // New leads in period
    prisma.application.count({ where: { status: "NEW_LEAD", createdAt: { gte: startDate } } }),

    // Approved in period
    prisma.application.count({ where: { status: "APPROVED", updatedAt: { gte: startDate } } }),

    // Disbursed in period
    prisma.application.count({ where: { status: "DISBURSED", updatedAt: { gte: startDate } } }),

    // Rejected in period
    prisma.application.count({ where: { status: "REJECTED", updatedAt: { gte: startDate } } }),

    // Applications by product in period
    prisma.application.groupBy({
      by: ["loanProductId"],
      where: { createdAt: { gte: startDate } },
      _count: { id: true },
    }),

    // Applications by status (all time)
    prisma.application.groupBy({
      by: ["status"],
      _count: { id: true },
    }),

    // Team performance in period
    prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        role: true,
        _count: {
          select: {
            createdApplications: { where: { createdAt: { gte: startDate } } },
            assignedApplications: true,
          },
        },
      },
    }),

    // Recent status changes
    prisma.statusHistory.findMany({
      where: { createdAt: { gte: startDate } },
      include: {
        application: {
          include: {
            customer: { select: { name: true } },
            loanProduct: { select: { name: true } },
          },
        },
        changedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  // Resolve loan product names
  const products = await prisma.loanProduct.findMany({ select: { id: true, name: true } });
  const productMap = Object.fromEntries(products.map((p) => [p.id, p.name]));

  const productBreakdown = applicationsByProduct.map((p) => ({
    name: productMap[p.loanProductId] || p.loanProductId,
    count: p._count.id,
  }));

  const statusBreakdown = applicationsByStatus.map((s) => ({
    status: s.status,
    count: s._count.id,
  }));

  // Total approved amount (pipeline value)
  const pipelineResult = await prisma.application.aggregate({
    where: { status: { in: ["APPROVED", "DISBURSED"] }, updatedAt: { gte: startDate } },
    _sum: { approvedAmount: true },
  });

  return NextResponse.json({
    period,
    startDate,
    stats: {
      totalApplications,
      newLeads,
      approved,
      disbursed,
      rejected,
      approvedAmount: pipelineResult._sum.approvedAmount ?? 0,
    },
    productBreakdown,
    statusBreakdown,
    teamStats,
    recentActivity,
  });
}
