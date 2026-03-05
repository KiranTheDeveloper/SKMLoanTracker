export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, Clock, TrendingUp, AlertCircle, Bell, Activity, CheckCircle } from "lucide-react";
import Link from "next/link";
import { formatDate, formatDateTime, isOverdue } from "@/lib/utils";
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { ReminderCompleteButton } from "@/components/reminders/ReminderCompleteButton";

async function getDashboardData(userId: string, role: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const userFilter = role === "ADMIN" ? {} : { assignedToId: userId };

  const [
    totalCustomers,
    activeApplications,
    docsRequested,
    disbursedThisMonth,
    overdueReminders,
    todayReminders,
    recentActivity,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.application.count({
      where: { ...userFilter, status: { notIn: ["DISBURSED", "REJECTED", "DROPPED"] } },
    }),
    prisma.application.count({
      where: { ...userFilter, status: { in: ["DOCS_REQUESTED", "DOCS_PARTIAL"] } },
    }),
    prisma.application.count({
      where: { status: "DISBURSED", updatedAt: { gte: startOfMonth } },
    }),
    prisma.reminder.findMany({
      where: { userId, isCompleted: false, dueDate: { lt: now } },
      include: {
        application: {
          include: {
            customer: { select: { name: true } },
            loanProduct: { select: { name: true } },
          },
        },
      },
      orderBy: { dueDate: "asc" },
      take: 6,
    }),
    prisma.reminder.findMany({
      where: { userId, isCompleted: false, dueDate: { gte: now, lte: todayEnd } },
      include: {
        application: {
          include: {
            customer: { select: { name: true } },
            loanProduct: { select: { name: true } },
          },
        },
      },
      orderBy: { dueDate: "asc" },
    }),
    prisma.statusHistory.findMany({
      where: role === "ADMIN" ? {} : { changedById: userId },
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
      take: 8,
    }),
  ]);

  return { totalCustomers, activeApplications, docsRequested, disbursedThisMonth, overdueReminders, todayReminders, recentActivity };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const { totalCustomers, activeApplications, docsRequested, disbursedThisMonth, overdueReminders, todayReminders, recentActivity } =
    await getDashboardData(session.user.id, session.user.role ?? "AGENT");

  const stats = [
    { label: "Total Customers", value: totalCustomers, icon: Users, color: "text-blue-400", bg: "bg-blue-900/40", href: "/customers" },
    { label: "Active Applications", value: activeApplications, icon: FileText, color: "text-orange-400", bg: "bg-orange-900/40", href: "/applications" },
    { label: "Docs Pending", value: docsRequested, icon: Clock, color: "text-yellow-400", bg: "bg-yellow-900/40", href: "/applications?status=DOCS_REQUESTED" },
    { label: "Disbursed (Month)", value: disbursedThisMonth, icon: TrendingUp, color: "text-green-400", bg: "bg-green-900/40", href: "/applications?status=DISBURSED" },
  ];

  return (
    <>
      <Header title="Dashboard" subtitle={`Welcome back, ${session.user.name}`} />
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Link key={s.label} href={s.href}>
                <Card className="hover:border-slate-600 transition-colors cursor-pointer">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-slate-400">{s.label}</p>
                        <p className="text-2xl sm:text-3xl font-bold mt-1 text-slate-100">{s.value}</p>
                      </div>
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${s.bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${s.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Overdue Reminders */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-red-400 text-base">
                  <AlertCircle className="w-4 h-4" />
                  Overdue Follow-ups
                  {overdueReminders.length > 0 && (
                    <span className="bg-red-900/40 text-red-300 text-xs px-2 py-0.5 rounded-full">{overdueReminders.length}</span>
                  )}
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/reminders">View all</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {overdueReminders.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No overdue follow-ups</p>
              ) : (
                <div className="space-y-2">
                  {overdueReminders.map((r) => (
                    <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg bg-red-900/20 border border-red-900/30">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-100 truncate">{r.title}</p>
                        {r.application && (
                          <p className="text-xs text-slate-400">{r.application.customer.name} · {r.application.loanProduct.name}</p>
                        )}
                        <p className="text-xs text-red-400 mt-0.5">Due: {formatDate(r.dueDate)}</p>
                      </div>
                      <ReminderCompleteButton reminderId={r.id} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Reminders */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="w-4 h-4 text-blue-400" />
                {"Today's Follow-ups"}
                {todayReminders.length > 0 && (
                  <span className="bg-blue-900/40 text-blue-300 text-xs px-2 py-0.5 rounded-full">{todayReminders.length}</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayReminders.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No reminders for today</p>
              ) : (
                <div className="space-y-2">
                  {todayReminders.map((r) => (
                    <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg bg-blue-900/20 border border-blue-900/30">
                      <Bell className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-100 truncate">{r.title}</p>
                        {r.application && (
                          <p className="text-xs text-slate-400">{r.application.customer.name} · {r.application.loanProduct.name}</p>
                        )}
                      </div>
                      <ReminderCompleteButton reminderId={r.id} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-4 h-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-0.5">
                {recentActivity.map((h) => (
                  <Link
                    key={h.id}
                    href={`/applications/${h.applicationId}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/40 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-200 truncate">
                        {h.application.customer.name}
                        <span className="text-slate-400 font-normal"> · {h.application.loanProduct.name}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={APPLICATION_STATUS_COLORS[h.status] || ""}>
                          {APPLICATION_STATUS_LABELS[h.status] || h.status}
                        </Badge>
                        <span className="text-xs text-slate-500">by {h.changedBy.name}</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 flex-shrink-0">{formatDateTime(h.createdAt)}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
