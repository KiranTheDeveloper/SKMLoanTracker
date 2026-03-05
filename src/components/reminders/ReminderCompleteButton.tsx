"use client";
import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ReminderCompleteButton({ reminderId }: { reminderId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleComplete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      await fetch(`/api/reminders/${reminderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: true }),
      });
      toast.success("Reminder marked complete");
      router.refresh();
    } catch {
      toast.error("Failed to update reminder");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleComplete}
      disabled={loading}
      className="text-slate-400 hover:text-green-400 transition-colors p-1 flex-shrink-0"
      title="Mark complete"
    >
      <CheckCircle className="w-4 h-4" />
    </button>
  );
}
