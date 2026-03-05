"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, CheckCircle, Trash2, Bell, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, isOverdue, isDueToday } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date;
  isCompleted: boolean;
  userId: string;
  user: { name: string };
}

interface Props {
  applicationId: string;
  reminders: Reminder[];
  agents: { id: string; name: string }[];
  currentUserId: string;
}

export function ReminderSection({ applicationId, reminders, agents, currentUserId }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [userId, setUserId] = useState(currentUserId);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, dueDate, applicationId, userId }),
      });
      toast.success("Reminder added");
      setTitle("");
      setDescription("");
      setDueDate("");
      setShowForm(false);
      router.refresh();
    } catch {
      toast.error("Failed to add reminder");
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete(id: string) {
    await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: true }),
    });
    toast.success("Reminder completed");
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this reminder?")) return;
    await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    toast.success("Reminder deleted");
    router.refresh();
  }

  const activeReminders = reminders.filter((r) => !r.isCompleted);
  const completedReminders = reminders.filter((r) => r.isCompleted);

  return (
    <div className="space-y-3">
      {/* Add form */}
      {showForm ? (
        <form onSubmit={handleAdd} className="border border-slate-600 rounded-lg p-4 space-y-3 bg-slate-700/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Call customer, Follow up with bank..." required />
            </div>
            <div className="space-y-1.5">
              <Label>Due Date & Time *</Label>
              <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Assign to</Label>
              <select value={userId} onChange={(e) => setUserId(e.target.value)} className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details..." rows={2} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading}>Add Reminder</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Add Reminder
        </Button>
      )}

      {/* Active reminders */}
      {activeReminders.length > 0 && (
        <div className="space-y-2">
          {activeReminders.map((r) => {
            const overdue = isOverdue(r.dueDate);
            const today = isDueToday(r.dueDate);
            return (
              <div
                key={r.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border",
                  overdue ? "border-red-800/40 bg-red-900/15" : today ? "border-blue-800/40 bg-blue-900/15" : "border-slate-700 bg-slate-700/20"
                )}
              >
                {overdue ? <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" /> : <Bell className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200">{r.title}</p>
                  {r.description && <p className="text-xs text-slate-400 mt-0.5">{r.description}</p>}
                  <p className={cn("text-xs mt-0.5", overdue ? "text-red-400" : "text-slate-500")}>
                    {overdue ? "Overdue: " : "Due: "}{formatDate(r.dueDate)} · {r.user.name}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => handleComplete(r.id)} className="p-1 text-slate-400 hover:text-green-400" title="Mark complete">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="p-1 text-slate-400 hover:text-red-400" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed */}
      {completedReminders.length > 0 && (
        <details className="group">
          <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-200 list-none flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            {completedReminders.length} completed
          </summary>
          <div className="mt-2 space-y-1.5">
            {completedReminders.map((r) => (
              <div key={r.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-700/20 opacity-60">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-300 line-through truncate">{r.title}</p>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {activeReminders.length === 0 && completedReminders.length === 0 && !showForm && (
        <p className="text-sm text-slate-400 text-center py-4">No reminders yet</p>
      )}
    </div>
  );
}
