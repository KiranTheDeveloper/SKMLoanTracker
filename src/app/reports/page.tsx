export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from "@/lib/constants";
import { ReportsPeriodSelector } from "@/components/reports/ReportsPeriodSelector";
import { BarChart2, TrendingUp, Users, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

async function getReportsData(period: string) {
  const now = new Date();
  let startDate: Date;

  if (period === "daily") {
    startDate = new Date(now); startDate.setHours(0, 0, 0, 0);
  } else if (period === "weekly") {
    startDate = new Date(now); startDate.setDate(now.getDate() - 7);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const [stats, productBreakdown, teamStats, recentActivity] = await Promise.all([
    Promise.all([
      prisma.application.count({ where: { createdAt: { gte: startDate } } }),
      prisma.application.count({ where: { status: "NEW_LEAD", createdAt: { gte: startDate } } }),
      prisma.application.count({ where: { status: "APPROVED", updatedAt: { gte: startDate } } }),
      prisma.application.count({ where: { status: "DISBURSED", updatedAt: { gte: startDate } } }),
      prisma.application.count({ where: { status: "REJECTED", updatedAt: { gte: startDate } } }),
      prisma.application.aggregate({
        where: { status: { in: ["APPROVED", "DISBURSED"] }, updatedAt: { gte: startDate } },
        _sum: { approvedAmount: true },
      }),
    ]),

    prisma.application.groupBy({
      by: ["loanProductId"],
      where: { createdAt: { gte: startDate } },
      _count: { id: true },
    }),

    prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true, name: true, role: true,
        _count: {
          select: {
            createdApplications: { where: { createdAt: { gte: startDate } } },
            assignedApplications: { where: { status: { in: ["APPROVED", "DISBURSED"] }, updatedAt: { gte: startDate } } },
          },
        },
      },
      orderBy: { name: "asc" },
    }),

    prisma.statusHistory.findMany({
      where: { createdAt: { gte: startDate } },
      include: {
        application: { include: { customer: { select: { name: true } }, loanProduct: { select: { name: true } } } },
        changedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  const [total, newLeads, approved, disbursed, rejected, pipelineResult] = stats;

  const products = await prisma.loanProduct.findMany({ select: { id: true, name: true } });
  const productMap = Object.fromEntries(products.map((p) => [p.id, p.name]));

  return {
    startDate,
    stats: { total, newLeads, approved, disbursed, rejected, pipeline: pipelineResult._sum.approvedAmount ?? 0 },
    productBreakdown: productBreakdown.map((p) => ({ name: productMap[p.loanProductId] || "Unknown", count: p._count.id })).sort((a, b) => b.count - a.count),
    teamStats,
    recentActivity,
  };
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const sp = await searchParams;
  const period = sp.period || "monthly";
  const { stats, productBreakdown, teamStats, recentActivity } = await getReportsData(period);

  const periodLabel = period === "daily" ? "Today" : period === "weekly" ? "Last 7 Days" : "This Month";

  return (
    <>
      <Header title="Reports" subtitle={periodLabel} />
      <div className="p-4 sm:p-6 space-y-4">
        <ReportsPeriodSelector currentPeriod={period} />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-slate-300" },
            { label: "New Leads", value: stats.newLeads, color: "text-blue-400" },
            { label: "Approved", value: stats.approved, color: "text-green-400" },
            { label: "Disbursed", value: stats.disbursed, color: "text-emerald-400" },
            { label: "Rejected", value: stats.rejected, color: "text-red-400" },
            { label: "Pipeline", value: formatCurrency(stats.pipeline), color: "text-purple-400", isStr: true },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-slate-400">{s.label}</p>
                <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Product Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart2 className="w-4 h-4" />
                Applications by Loan Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              {productBreakdown.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No data</p>
              ) : (
                <div className="space-y-2">
                  {productBreakdown.map((p) => {
                    const max = productBreakdown[0]?.count || 1;
                    const pct = Math.round((p.count / max) * 100);
                    return (
                      <div key={p.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-300">{p.name}</span>
                          <span className="text-slate-400">{p.count}</span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Performance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                Team Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead className="text-right">Created</TableHead>
                    <TableHead className="text-right">Closed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamStats.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm text-slate-200">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.role}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-slate-300">{u._count.createdApplications}</TableCell>
                      <TableCell className="text-right">
                        <span className={u._count.assignedApplications > 0 ? "text-green-400" : "text-slate-400"}>
                          {u._count.assignedApplications}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0.5">
              {recentActivity.map((h) => (
                <Link key={h.id} href={`/applications/${h.applicationId}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-700/40 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">
                      {h.application.customer.name} · {h.application.loanProduct.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${APPLICATION_STATUS_COLORS[h.status] || ""}`}>
                        {APPLICATION_STATUS_LABELS[h.status] || h.status}
                      </Badge>
                      <span className="text-xs text-slate-500">by {h.changedBy.name}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0">{formatDateTime(h.createdAt)}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
