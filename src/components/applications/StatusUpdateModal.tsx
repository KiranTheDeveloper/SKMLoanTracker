"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS } from "@/lib/constants";

interface Props {
  application: any;
  agents: { id: string; name: string }[];
  currentUserId: string;
}

export function StatusUpdateModal({ application, agents, currentUserId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(application.status);
  const [notes, setNotes] = useState("");
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [approvedAmount, setApprovedAmount] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [assignedToId, setAssignedToId] = useState(application.assignedToId || "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Update status
      const res = await fetch(`/api/applications/${application.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          notes,
          reminderTitle,
          reminderDate,
          approvedAmount: approvedAmount ? Number(approvedAmount) : undefined,
          rejectionReason,
        }),
      });

      if (!res.ok) throw new Error("Status update failed");

      // Update assignment if changed
      if (assignedToId !== (application.assignedToId || "")) {
        await fetch(`/api/applications/${application.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignedToId }),
        });
      }

      toast.success("Application updated");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to update application");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <TrendingUp className="w-4 h-4" />
          Update Status
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Application</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          {(status === "APPROVED" || status === "DISBURSED") && (
            <div className="space-y-1.5">
              <Label>Approved Amount (₹)</Label>
              <Input
                type="number"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                placeholder="Enter approved loan amount"
              />
            </div>
          )}

          {(status === "REJECTED" || status === "DROPPED") && (
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection/dropping..."
                rows={2}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Assign To</Label>
            <select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Unassigned</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note about this update..."
              rows={2}
            />
          </div>

          <div className="border-t border-slate-700 pt-3 space-y-3">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Set Follow-up Reminder (optional)</p>
            <div className="space-y-1.5">
              <Label>Reminder Title</Label>
              <Input
                value={reminderTitle}
                onChange={(e) => setReminderTitle(e.target.value)}
                placeholder="Call customer, Follow up with bank..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Reminder Date & Time</Label>
              <Input
                type="datetime-local"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Saving..." : "Update Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
