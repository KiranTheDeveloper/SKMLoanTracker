"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  loanProductId: z.string().min(1, "Loan type is required"),
  requestedAmount: z.coerce.number().optional(),
  tenure: z.coerce.number().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  notes: z.string().optional().or(z.literal("")),
  assignedToId: z.string().optional().or(z.literal("")),
});

type FormData = {
  customerId: string;
  loanProductId: string;
  requestedAmount?: number;
  tenure?: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  notes?: string;
  assignedToId?: string;
};

interface Props {
  customers: { id: string; name: string; phone: string }[];
  loanProducts: { id: string; name: string }[];
  agents: { id: string; name: string }[];
  defaultCustomerId?: string;
  defaultAssignedToId?: string;
}

export function ApplicationForm({ customers, loanProducts, agents, defaultCustomerId, defaultAssignedToId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: defaultCustomerId || "",
      assignedToId: defaultAssignedToId || "",
      priority: "MEDIUM",
    },
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }

      const app = await res.json();
      toast.success("Application created");
      router.push(`/applications/${app.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="customerId">Customer *</Label>
        <select id="customerId" {...register("customerId")} className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Select customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
          ))}
        </select>
        {errors.customerId && <p className="text-xs text-red-400">{errors.customerId.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="loanProductId">Loan Type *</Label>
        <select id="loanProductId" {...register("loanProductId")} className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Select loan type</option>
          {loanProducts.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {errors.loanProductId && <p className="text-xs text-red-400">{errors.loanProductId.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="requestedAmount">Requested Amount (₹)</Label>
          <Input id="requestedAmount" type="number" {...register("requestedAmount")} placeholder="500000" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tenure">Tenure (months)</Label>
          <Input id="tenure" type="number" {...register("tenure")} placeholder="60" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="priority">Priority</Label>
          <select id="priority" {...register("priority")} className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="assignedToId">Assign to Agent</Label>
          <select id="assignedToId" {...register("assignedToId")} className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Unassigned</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register("notes")} placeholder="Any additional information..." rows={3} />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Creating..." : "Create Application"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
