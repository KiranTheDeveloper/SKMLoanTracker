export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { ApplicationForm } from "@/components/applications/ApplicationForm";

export default async function NewApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const sp = await searchParams;

  const [customers, loanProducts, agents] = await Promise.all([
    prisma.customer.findMany({
      select: { id: true, name: true, phone: true },
      orderBy: { name: "asc" },
    }),
    prisma.loanProduct.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <Header title="New Application" subtitle="Create a loan application" />
      <div className="p-4 sm:p-6 max-w-2xl">
        <ApplicationForm
          customers={customers}
          loanProducts={loanProducts}
          agents={agents}
          defaultCustomerId={sp.customerId || ""}
          defaultAssignedToId={session.user.id}
        />
      </div>
    </>
  );
}
