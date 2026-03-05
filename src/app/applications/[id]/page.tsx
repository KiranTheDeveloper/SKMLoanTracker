export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Phone, User, Clock, CheckCircle, FileText, Bell, TrendingUp, AlertCircle } from "lucide-react";
import { formatDate, formatDateTime, formatCurrency, isOverdue } from "@/lib/utils";
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from "@/lib/constants";
import { StatusUpdateModal } from "@/components/applications/StatusUpdateModal";
import { ReminderSection } from "@/components/applications/ReminderSection";
import { DocumentUploader } from "@/components/customers/DocumentUploader";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const [application, agents] = await Promise.all([
    prisma.application.findUnique({
      where: { id },
      include: {
        customer: true,
        loanProduct: true,
        createdBy: { select: { name: true } },
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
    }),
    prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!application) notFound();

  const activeReminders = application.reminders.filter((r) => !r.isCompleted);
  const overdueCount = activeReminders.filter((r) => isOverdue(r.dueDate)).length;

  return (
    <>
      <Header
        title={`${application.customer.name} — ${application.loanProduct.name}`}
        subtitle={`Application · ${formatDate(application.createdAt)}`}
        actions={
          <StatusUpdateModal
            application={application}
            agents={agents}
            currentUserId={session.user.id}
          />
        }
      />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main info */}
          <Card className="lg:col-span-2">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className={APPLICATION_STATUS_COLORS[application.status] || ""}>
                  {APPLICATION_STATUS_LABELS[application.status] || application.status}
                </Badge>
                <Badge className={PRIORITY_COLORS[application.priority] || ""}>
                  {PRIORITY_LABELS[application.priority]}
                </Badge>
                {overdueCount > 0 && (
                  <Badge className="bg-red-900/40 text-red-300">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {overdueCount} overdue
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-slate-400 text-xs">Customer</p>
                  <Link href={`/customers/${application.customer.id}`} className="text-blue-400 hover:underline font-medium">
                    {application.customer.name}
                  </Link>
                  <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" />{application.customer.phone}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Loan Type</p>
                  <p className="text-slate-200">{application.loanProduct.name}</p>
                </div>
                {application.requestedAmount && (
                  <div>
                    <p className="text-slate-400 text-xs">Requested</p>
                    <p className="text-slate-200">{formatCurrency(application.requestedAmount)}</p>
                  </div>
                )}
                {application.approvedAmount && (
                  <div>
                    <p className="text-slate-400 text-xs">Approved</p>
                    <p className="text-green-400 font-semibold">{formatCurrency(application.approvedAmount)}</p>
                  </div>
                )}
                {application.tenure && (
                  <div>
                    <p className="text-slate-400 text-xs">Tenure</p>
                    <p className="text-slate-200">{application.tenure} months</p>
                  </div>
                )}
                {application.interestRate && (
                  <div>
                    <p className="text-slate-400 text-xs">Interest Rate</p>
                    <p className="text-slate-200">{application.interestRate}% p.a.</p>
                  </div>
                )}
                <div>
                  <p className="text-slate-400 text-xs">Assigned To</p>
                  <p className="text-slate-200">{application.assignedTo?.name || "Unassigned"}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Created By</p>
                  <p className="text-slate-200">{application.createdBy.name}</p>
                </div>
              </div>

              {application.notes && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Notes</p>
                  <p className="text-sm text-slate-300">{application.notes}</p>
                </div>
              )}
              {application.rejectionReason && (
                <div className="mt-3 p-3 bg-red-900/20 border border-red-800/40 rounded-lg">
                  <p className="text-xs text-red-400 font-medium">Rejection Reason</p>
                  <p className="text-sm text-slate-300 mt-0.5">{application.rejectionReason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Status Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {application.statusHistory.map((h, i) => (
                  <div key={h.id} className="flex gap-2.5">
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${i === 0 ? "bg-blue-500" : "bg-slate-600"}`} />
                      {i < application.statusHistory.length - 1 && <div className="w-px flex-1 bg-slate-700 mt-1" />}
                    </div>
                    <div className="pb-3 min-w-0">
                      <Badge className={`text-xs ${APPLICATION_STATUS_COLORS[h.status] || ""}`}>
                        {APPLICATION_STATUS_LABELS[h.status] || h.status}
                      </Badge>
                      <p className="text-xs text-slate-400 mt-1">{h.changedBy.name}</p>
                      {h.notes && <p className="text-xs text-slate-500 mt-0.5">{h.notes}</p>}
                      <p className="text-xs text-slate-600 mt-0.5">{formatDateTime(h.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reminders */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Reminders
              {activeReminders.length > 0 && (
                <Badge className="bg-slate-700 text-slate-300">{activeReminders.length} active</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReminderSection
              applicationId={id}
              reminders={application.reminders}
              agents={agents}
              currentUserId={session.user.id}
            />
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documents
              <Badge className="bg-slate-700 text-slate-300">{application.documents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentUploader
              customerId={application.customerId}
              applicationId={id}
              existingDocs={application.documents}
              isAdmin={session.user.role === "ADMIN"}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
