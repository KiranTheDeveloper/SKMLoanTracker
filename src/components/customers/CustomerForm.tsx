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
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { INDIAN_STATES } from "@/lib/constants";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Valid phone required"),
  altPhone: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  pincode: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  occupation: z.string().optional().or(z.literal("")),
  employerName: z.string().optional().or(z.literal("")),
  monthlyIncome: z.coerce.number().optional(),
  aadhaarNo: z.string().optional().or(z.literal("")),
  panNo: z.string().optional().or(z.literal("")),
  dob: z.string().optional().or(z.literal("")),
  gender: z.string().optional().or(z.literal("")),
  assignedToId: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

interface Agent { id: string; name: string }

interface CustomerFormProps {
  agents: Agent[];
  defaultAssignedToId?: string;
  initialData?: Partial<FormData> & { id?: string };
  mode?: "create" | "edit";
}

export function CustomerForm({ agents, defaultAssignedToId, initialData, mode = "create" }: CustomerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...initialData,
      assignedToId: initialData?.assignedToId || defaultAssignedToId || "",
    },
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const url = mode === "edit" ? `/api/customers/${initialData?.id}` : "/api/customers";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }

      const customer = await res.json();
      toast.success(mode === "edit" ? "Customer updated" : "Customer added");
      router.push(`/customers/${customer.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const Field = ({ label, name, error, children }: { label: string; name: string; error?: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );

  if (mode === "create") {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Minimal info notice */}
        <div className="flex items-start gap-3 rounded-lg bg-blue-900/20 border border-blue-800/40 px-4 py-3">
          <Sparkles className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-300">Just Name &amp; Phone needed to start</p>
            <p className="text-xs text-blue-400/80 mt-0.5">
              After saving, upload KYC documents (Aadhaar, PAN, bank statement, salary slip…) and AI will automatically extract and fill in address, date of birth, bank details, income, and more.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name *" name="name" error={errors.name?.message}>
            <Input id="name" {...register("name")} placeholder="Rajesh Kumar" autoFocus />
          </Field>
          <Field label="Phone *" name="phone" error={errors.phone?.message}>
            <Input id="phone" {...register("phone")} placeholder="9876543210" />
          </Field>
          <Field label="Alt Phone" name="altPhone" error={errors.altPhone?.message}>
            <Input id="altPhone" {...register("altPhone")} placeholder="Optional" />
          </Field>
          <Field label="Email" name="email" error={errors.email?.message}>
            <Input id="email" type="email" {...register("email")} placeholder="email@example.com" />
          </Field>
        </div>

        <div className="space-y-1.5 max-w-xs">
          <Label htmlFor="assignedToId">Assign to Agent</Label>
          <select id="assignedToId" {...register("assignedToId")} className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <option value="">Unassigned</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Creating..." : "Create & Upload Documents"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    );
  }

  // Edit mode — show all fields
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Basic Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name *" name="name" error={errors.name?.message}>
            <Input id="name" {...register("name")} placeholder="Rajesh Kumar" />
          </Field>
          <Field label="Phone *" name="phone" error={errors.phone?.message}>
            <Input id="phone" {...register("phone")} placeholder="9876543210" />
          </Field>
          <Field label="Alt Phone" name="altPhone" error={errors.altPhone?.message}>
            <Input id="altPhone" {...register("altPhone")} placeholder="Optional" />
          </Field>
          <Field label="Email" name="email" error={errors.email?.message}>
            <Input id="email" type="email" {...register("email")} placeholder="email@example.com" />
          </Field>
          <div className="space-y-1.5">
            <Label htmlFor="gender">Gender</Label>
            <select id="gender" {...register("gender")} className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <Field label="Date of Birth" name="dob" error={errors.dob?.message}>
            <Input id="dob" type="date" {...register("dob")} />
          </Field>
        </div>
      </div>

      {/* Address */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Address</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="City" name="city" error={errors.city?.message}>
            <Input id="city" {...register("city")} placeholder="Mumbai" />
          </Field>
          <div className="space-y-1.5">
            <Label htmlFor="state">State</Label>
            <select id="state" {...register("state")} className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              <option value="">Select state</option>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Field label="PIN Code" name="pincode" error={errors.pincode?.message}>
            <Input id="pincode" {...register("pincode")} placeholder="400001" maxLength={6} />
          </Field>
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="address">Full Address</Label>
            <Textarea id="address" {...register("address")} placeholder="Flat no., Building, Street, Area..." rows={2} />
          </div>
        </div>
      </div>

      {/* Employment */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Employment & Income</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Occupation" name="occupation" error={errors.occupation?.message}>
            <Input id="occupation" {...register("occupation")} placeholder="Salaried / Self-Employed / Business" />
          </Field>
          <Field label="Employer / Company Name" name="employerName" error={errors.employerName?.message}>
            <Input id="employerName" {...register("employerName")} placeholder="TCS, Reliance..." />
          </Field>
          <Field label="Monthly Income (₹)" name="monthlyIncome" error={errors.monthlyIncome?.message}>
            <Input id="monthlyIncome" type="number" {...register("monthlyIncome")} placeholder="50000" />
          </Field>
        </div>
      </div>

      {/* KYC */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">KYC Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Aadhaar No." name="aadhaarNo" error={errors.aadhaarNo?.message}>
            <Input id="aadhaarNo" {...register("aadhaarNo")} placeholder="XXXX XXXX XXXX" maxLength={14} />
          </Field>
          <Field label="PAN No." name="panNo" error={errors.panNo?.message}>
            <Input id="panNo" {...register("panNo")} placeholder="ABCDE1234F" maxLength={10} className="uppercase" />
          </Field>
        </div>
      </div>

      {/* Assignment */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Assignment</h3>
        <div className="space-y-1.5 max-w-xs">
          <Label htmlFor="assignedToId">Assign to Agent</Label>
          <select id="assignedToId" {...register("assignedToId")} className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <option value="">Unassigned</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Saving..." : "Update Customer"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
