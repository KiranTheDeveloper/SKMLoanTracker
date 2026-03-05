"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Edit, UserX, UserCheck } from "lucide-react";

interface Props {
  mode: "add" | "edit";
  userId: string;
  user?: any;
  currentUserId?: string;
}

export function TeamActions({ mode, userId, user, currentUserId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [role, setRole] = useState(user?.role || "AGENT");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = mode === "add" ? "/api/team" : `/api/team/${userId}`;
      const method = mode === "add" ? "POST" : "PUT";
      const body = mode === "add"
        ? { name, email, phone, role, password }
        : { name, phone, role, ...(newPassword ? { newPassword } : {}) };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }

      toast.success(mode === "add" ? "Team member added" : "Team member updated");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive() {
    if (!confirm(`${user?.isActive ? "Deactivate" : "Activate"} this user?`)) return;
    await fetch(`/api/team/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user?.isActive }),
    });
    toast.success("Updated");
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {mode === "edit" && userId !== currentUserId && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleToggleActive}
          className={user?.isActive ? "text-slate-400 hover:text-red-400" : "text-slate-400 hover:text-green-400"}
        >
          {user?.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {mode === "add" ? (
            <Button size="sm">
              <Plus className="w-4 h-4" />
              Add Member
            </Button>
          ) : (
            <Button size="sm" variant="outline">
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          )}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === "add" ? "Add Team Member" : "Edit Team Member"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya Sharma" required />
            </div>
            {mode === "add" && (
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="agent@skmfinancial.com" required />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="AGENT">Agent</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            {mode === "add" ? (
              <div className="space-y-1.5">
                <Label>Password *</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>New Password (leave blank to keep current)</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" minLength={6} />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Saving..." : mode === "add" ? "Add Member" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
