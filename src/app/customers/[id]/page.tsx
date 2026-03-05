export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Phone, Mail, MapPin, Briefcase, CreditCard, Building2, Edit, Plus, FileText, Landmark, User, ShieldCheck, Sparkles } from "lucide-react";
import { formatDate, formatCurrency, maskAadhaar } from "@/lib/utils";
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from "@/lib/constants";
import { DocumentUploader } from "@/components/customers/DocumentUploader";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      assignedTo: { select: { name: true } },
      applications: {
        include: {
          loanProduct: true,
          assignedTo: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!customer) notFound();

  const kycIdentity = [
    { label: "Aadhaar No.", value: maskAadhaar(customer.aadhaarNo) },
    { label: "PAN No.", value: customer.panNo },
    { label: "Date of Birth", value: customer.dob },
    { label: "Gender", value: customer.gender },
  ].filter((f) => f.value);

  const kycBank = [
    { label: "Bank Name", value: customer.bankName },
    { label: "Account No.", value: customer.bankAccountNo },
    { label: "IFSC Code", value: customer.ifscCode },
  ].filter((f) => f.value);

  const kycBusiness = [
    { label: "GST No.", value: customer.gstNo },
  ].filter((f) => f.value);

  const totalKycFilled = kycIdentity.length + kycBank.length + kycBusiness.length;
  const hasAnyKyc = totalKycFilled > 0;

  return (
    <>
      <Header
        title={customer.name}
        subtitle={`Customer since ${formatDate(customer.createdAt)}`}
        actions={
          <Button size="sm" variant="outline" asChild>
            <Link href={`/customers/${id}/edit`}>
              <Edit className="w-4 h-4" />
              Edit
            </Link>
          </Button>
        }
      />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Contact & Basic Info */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <div>
                    <p>{customer.phone}</p>
                    {customer.altPhone && <p className="text-slate-400 text-xs">{customer.altPhone}</p>}
                  </div>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {customer.email}
                  </div>
                )}
                {(customer.city || customer.address) && (
                  <div className="flex items-start gap-2 text-slate-300 sm:col-span-2">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      {customer.address && <p>{customer.address}</p>}
                      <p className="text-slate-400 text-xs">
                        {[customer.city, customer.state, customer.pincode].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </div>
                )}
                {customer.occupation && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <div>
                      <p>{customer.occupation}</p>
                      {customer.employerName && <p className="text-slate-400 text-xs">{customer.employerName}</p>}
                    </div>
                  </div>
                )}
                {customer.monthlyIncome && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    Income: {formatCurrency(customer.monthlyIncome)}/mo
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-700 text-xs text-slate-400">
                <span>Added by {customer.createdBy.name}</span>
                {customer.assignedTo && <span>Assigned to {customer.assignedTo.name}</span>}
              </div>
            </CardContent>
          </Card>

          {/* KYC Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                KYC Details
                {hasAnyKyc && (
                  <Badge className="bg-green-900/40 text-green-400 text-xs">{totalKycFilled} field{totalKycFilled !== 1 ? "s" : ""}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!hasAnyKyc ? (
                <div className="text-center py-4">
                  <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No KYC data yet</p>
                  <p className="text-xs text-slate-500 mt-1">Upload documents below to auto-extract</p>
                </div>
              ) : (
                <>
                  {kycIdentity.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1 mb-2">
                        <User className="w-3 h-3" /> Identity
                      </p>
                      <div className="space-y-1.5">
                        {kycIdentity.map((f) => (
                          <div key={f.label} className="flex justify-between gap-2">
                            <span className="text-slate-400 text-xs flex-shrink-0">{f.label}</span>
                            <span className="text-slate-200 text-xs font-mono text-right">{f.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {kycBank.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1 mb-2">
                        <Landmark className="w-3 h-3" /> Bank Details
                      </p>
                      <div className="space-y-1.5">
                        {kycBank.map((f) => (
                          <div key={f.label} className="flex justify-between gap-2">
                            <span className="text-slate-400 text-xs flex-shrink-0">{f.label}</span>
                            <span className="text-slate-200 text-xs font-mono text-right">{f.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {kycBusiness.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1 mb-2">
                        <Building2 className="w-3 h-3" /> Business
                      </p>
                      <div className="space-y-1.5">
                        {kycBusiness.map((f) => (
                          <div key={f.label} className="flex justify-between gap-2">
                            <span className="text-slate-400 text-xs flex-shrink-0">{f.label}</span>
                            <span className="text-slate-200 text-xs font-mono text-right">{f.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className="pt-2 border-t border-slate-700/50">
                <p className="text-xs text-slate-500">
                  <CreditCard className="w-3 h-3 inline mr-1" />
                  Edit customer to update KYC fields manually
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents */}
        <Card className={customer.documents.length === 0 ? "border-blue-800/50 bg-blue-950/10" : ""}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                KYC Documents
                <Badge className="bg-slate-700 text-slate-300">{customer.documents.length}</Badge>
              </CardTitle>
              {customer.documents.length === 0 && (
                <span className="text-xs text-blue-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Upload to auto-fill customer info
                </span>
              )}
            </div>
            {customer.documents.length === 0 && (
              <p className="text-xs text-slate-400 mt-1">
                Upload Aadhaar, PAN, bank statement, salary slip, etc. — AI will automatically extract and save address, KYC numbers, income, bank details and more.
              </p>
            )}
          </CardHeader>
          <CardContent>
            <DocumentUploader customerId={id} existingDocs={customer.documents} isAdmin={session.user.role === "ADMIN"} />
          </CardContent>
        </Card>

        {/* Applications */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Applications
                <Badge className="bg-slate-700 text-slate-300">{customer.applications.length}</Badge>
              </CardTitle>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/applications/new?customerId=${id}`}>
                  <Plus className="w-3.5 h-3.5" />
                  New Application
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {customer.applications.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No applications yet</p>
            ) : (
              <div className="space-y-2">
                {customer.applications.map((app) => (
                  <Link key={app.id} href={`/applications/${app.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/60 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-slate-200">{app.loanProduct.name}</p>
                        <p className="text-xs text-slate-400">
                          {app.requestedAmount ? formatCurrency(app.requestedAmount) : "—"}
                          {app.assignedTo && ` · ${app.assignedTo.name}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={APPLICATION_STATUS_COLORS[app.status] || ""}>
                          {APPLICATION_STATUS_LABELS[app.status] || app.status}
                        </Badge>
                        <span className="text-xs text-slate-500">{formatDate(app.updatedAt)}</span>
                      </div>
                    </div>
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
