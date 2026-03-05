import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { prisma } from "@/lib/prisma";

export default async function NewCustomerPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const agents = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <Header title="Add Customer" subtitle="Name & phone only — upload KYC docs to fill in details" />
      <div className="p-4 sm:p-6 max-w-2xl">
        <CustomerForm agents={agents} defaultAssignedToId={session.user.id} />
      </div>
    </>
  );
}
