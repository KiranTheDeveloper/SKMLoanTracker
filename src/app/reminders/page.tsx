export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Bell, Clock } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import { ReminderCompleteButton } from "@/components/reminders/ReminderCompleteButton";
import Link from "next/link";

export default async function RemindersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);

  const baseWhere = { userId: session.user.id, isCompleted: false };
  const include = {
    application: {
      include: {
        customer: { select: { name: true, phone: true } },
        loanProduct: { select: { name: true } },
      },
    },
  };

  const [overdue, today, upcoming] = await Promise.all([
    prisma.reminder.findMany({ where: { ...baseWhere, dueDate: { lt: now } }, include, orderBy: { dueDate: "asc" } }),
    prisma.reminder.findMany({ where: { ...baseWhere, dueDate: { gte: now, lte: todayEnd } }, include, orderBy: { dueDate: "asc" } }),
    prisma.reminder.findMany({ where: { ...baseWhere, dueDate: { gt: todayEnd } }, include, orderBy: { dueDate: "asc" }, take: 30 }),
  ]);

  const Section = ({ title, reminders, icon: Icon, color, bg }: any) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className={`text-base flex items-center gap-2 ${color}`}>
          <Icon className="w-4 h-4" />
          {title}
          {reminders.length > 0 && (
            <span className={`${bg} text-xs px-2 py-0.5 rounded-full ml-1`}>{reminders.length}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reminders.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">None</p>
        ) : (
          <div className="space-y-2">
            {reminders.map((r: any) => (
              <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-700/50">
                <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200">{r.title}</p>
                  {r.description && <p className="text-xs text-slate-400 mt-0.5">{r.description}</p>}
                  {r.application && (
                    <Link href={`/applications/${r.applicationId}`} className="text-xs text-blue-400 hover:underline mt-0.5 block">
                      {r.application.customer.name} — {r.application.loanProduct.name}
                    </Link>
                  )}
                  <p className="text-xs text-slate-500 mt-1">{formatDateTime(r.dueDate)}</p>
                </div>
                <ReminderCompleteButton reminderId={r.id} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      <Header
        title="Reminders"
        subtitle={`${overdue.length + today.length} pending follow-ups`}
      />
      <div className="p-4 sm:p-6 space-y-4">
        <Section title="Overdue" reminders={overdue} icon={AlertCircle} color="text-red-400" bg="bg-red-900/30 text-red-300" />
        <Section title="Today" reminders={today} icon={Bell} color="text-blue-400" bg="bg-blue-900/30 text-blue-300" />
        <Section title="Upcoming" reminders={upcoming} icon={Clock} color="text-slate-300" bg="bg-slate-700 text-slate-300" />
      </div>
    </>
  );
}
