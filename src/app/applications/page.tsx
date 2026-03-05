export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, FileText, Phone } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS, PRIORITY_COLORS, PRIORITY_LABELS } from "@/lib/constants";
import { ApplicationsFilter } from "@/components/applications/ApplicationsFilter";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

async function getApplicationsData(status: string, loanProductId: string, search: string) {
  const [applications, loanProducts] = await Promise.all([
    prisma.application.findMany({
      where: {
        AND: [
          status ? { status: status as any } : {},
          loanProductId ? { loanProductId } : {},
          search
            ? {
                OR: [
                  { customer: { name: { contains: search, mode: "insensitive" } } },
                  { customer: { phone: { contains: search } } },
                ],
              }
            : {},
        ],
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        loanProduct: true,
        assignedTo: { select: { name: true } },
        _count: { select: { reminders: true } },
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.loanProduct.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return { applications, loanProducts };
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; loanProductId?: string; search?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const sp = await searchParams;
  const { applications, loanProducts } = await getApplicationsData(
    sp.status || "",
    sp.loanProductId || "",
    sp.search || ""
  );

  const groupedByProduct = loanProducts.map((product) => ({
    product,
    apps: applications.filter((a) => a.loanProductId === product.id),
  }));

  const totalByProduct: Record<string, number> = {};
  applications.forEach((a) => {
    totalByProduct[a.loanProductId] = (totalByProduct[a.loanProductId] || 0) + 1;
  });

  return (
    <>
      <Header
        title="Applications"
        subtitle={`${applications.length} application${applications.length !== 1 ? "s" : ""}`}
        actions={
          <Button size="sm" asChild>
            <Link href="/applications/new">
              <Plus className="w-4 h-4" />
              New Application
            </Link>
          </Button>
        }
      />
      <div className="p-4 sm:p-6 space-y-4">
        <ApplicationsFilter loanProducts={loanProducts} />

        {sp.loanProductId ? (
          <ApplicationList apps={applications} />
        ) : (
          <Tabs defaultValue="all">
            <div className="overflow-x-auto pb-1">
              <TabsList>
                <TabsTrigger value="all">All ({applications.length})</TabsTrigger>
                {groupedByProduct.filter((g) => g.apps.length > 0).map((g) => (
                  <TabsTrigger key={g.product.id} value={g.product.id}>
                    {g.product.name} ({g.apps.length})
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <TabsContent value="all">
              <ApplicationList apps={applications} />
            </TabsContent>
            {groupedByProduct.map((g) => (
              <TabsContent key={g.product.id} value={g.product.id}>
                <ApplicationList apps={g.apps} />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </>
  );
}

function ApplicationList({ apps }: { apps: any[] }) {
  if (apps.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-lg font-medium">No applications found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {apps.map((app) => (
        <Link key={app.id} href={`/applications/${app.id}`}>
          <Card className="hover:border-slate-600 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-100">{app.customer.name}</p>
                    <Badge className={PRIORITY_COLORS[app.priority] || ""}>{PRIORITY_LABELS[app.priority]}</Badge>
                    <Badge className={APPLICATION_STATUS_COLORS[app.status] || ""}>
                      {APPLICATION_STATUS_LABELS[app.status] || app.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {app.customer.phone}
                    </span>
                    <span>{app.loanProduct.name}</span>
                    {app.requestedAmount && <span>{formatCurrency(app.requestedAmount)}</span>}
                    {app.assignedTo && <span>Agent: {app.assignedTo.name}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {app._count.reminders > 0 && (
                    <Badge className="bg-yellow-900/30 text-yellow-300 text-xs">{app._count.reminders} reminder{app._count.reminders > 1 ? "s" : ""}</Badge>
                  )}
                  <span>{formatDate(app.updatedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
