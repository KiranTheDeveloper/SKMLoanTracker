export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, Phone, Mail, FileText, User } from "lucide-react";
import { formatDate, maskAadhaar } from "@/lib/utils";
import { CustomerSearchFilter } from "@/components/customers/CustomerSearchFilter";

interface SearchParams {
  search?: string;
  assignedToId?: string;
}

async function getCustomers(search: string, assignedToId: string) {
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
      assignedTo: { select: { name: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return customers;
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const sp = await searchParams;
  const search = sp.search || "";
  const assignedToId = sp.assignedToId || "";

  const customers = await getCustomers(search, assignedToId);

  return (
    <>
      <Header
        title="Customers"
        subtitle={`${customers.length} customer${customers.length !== 1 ? "s" : ""}`}
        actions={
          <Button size="sm" asChild>
            <Link href="/customers/new">
              <Plus className="w-4 h-4" />
              Add Customer
            </Link>
          </Button>
        }
      />
      <div className="p-4 sm:p-6 space-y-4">
        <CustomerSearchFilter />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {customers.length === 0 ? (
            <div className="col-span-full text-center py-16 text-slate-400">
              <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No customers found</p>
              <p className="text-sm mt-1">Add your first customer to get started</p>
              <Button className="mt-4" asChild>
                <Link href="/customers/new">Add Customer</Link>
              </Button>
            </div>
          ) : (
            customers.map((c) => (
              <Link key={c.id} href={`/customers/${c.id}`}>
                <Card className="hover:border-slate-600 transition-colors cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-100 truncate">{c.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-slate-400 text-xs">
                          <Phone className="w-3 h-3" />
                          {c.phone}
                        </div>
                      </div>
                      <Badge className="bg-blue-900/40 text-blue-300 flex-shrink-0">
                        {c._count.applications} {c._count.applications === 1 ? "app" : "apps"}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-400">
                      {c.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{c.email}</span>
                        </div>
                      )}
                      {c.panNo && (
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3 h-3" />
                          PAN: {c.panNo}
                        </div>
                      )}
                      {c.aadhaarNo && (
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3 h-3" />
                          Aadhaar: {maskAadhaar(c.aadhaarNo)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700 text-xs text-slate-500">
                      <span>{c.city ? `${c.city}${c.state ? `, ${c.state}` : ""}` : "—"}</span>
                      {c.assignedTo && <span>Agent: {c.assignedTo.name}</span>}
                      <span>{formatDate(c.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  );
}
