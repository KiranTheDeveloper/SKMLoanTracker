export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { CustomerForm } from "@/components/customers/CustomerForm";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const [customer, agents] = await Promise.all([
    prisma.customer.findUnique({ where: { id } }),
    prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!customer) notFound();

  return (
    <>
      <Header title={`Edit: ${customer.name}`} subtitle="Update customer information" />
      <div className="p-4 sm:p-6 max-w-2xl">
        <CustomerForm
          agents={agents}
          mode="edit"
          initialData={{
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            altPhone: customer.altPhone ?? "",
            email: customer.email ?? "",
            city: customer.city ?? "",
            state: customer.state ?? "",
            pincode: customer.pincode ?? "",
            address: customer.address ?? "",
            occupation: customer.occupation ?? "",
            employerName: customer.employerName ?? "",
            monthlyIncome: customer.monthlyIncome ?? undefined,
            aadhaarNo: customer.aadhaarNo ?? "",
            panNo: customer.panNo ?? "",
            dob: customer.dob ?? "",
            gender: customer.gender ?? "",
            assignedToId: customer.assignedToId ?? "",
          }}
        />
      </div>
    </>
  );
}
