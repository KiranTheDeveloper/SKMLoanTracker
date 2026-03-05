"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const periods = [
  { value: "daily", label: "Today" },
  { value: "weekly", label: "Last 7 Days" },
  { value: "monthly", label: "This Month" },
];

export function ReportsPeriodSelector({ currentPeriod }: { currentPeriod: string }) {
  const router = useRouter();
  return (
    <div className="flex gap-2">
      {periods.map((p) => (
        <Button
          key={p.value}
          size="sm"
          variant={currentPeriod === p.value ? "default" : "outline"}
          onClick={() => router.push(`/reports?period=${p.value}`)}
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}
