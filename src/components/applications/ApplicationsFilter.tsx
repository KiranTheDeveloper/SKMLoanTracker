"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUSES } from "@/lib/constants";
import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useDebounce } from "@/lib/hooks";

interface LoanProduct { id: string; name: string }

export function ApplicationsFilter({ loanProducts }: { loanProducts: LoanProduct[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(search, 300);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/applications?${params.toString()}`);
  }

  useEffect(() => {
    setParam("search", debouncedSearch);
  }, [debouncedSearch]);

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer..."
          className="pl-9 pr-8"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <select
        value={searchParams.get("status") || ""}
        onChange={(e) => setParam("status", e.target.value)}
        className="h-10 rounded-md border border-slate-600 bg-slate-700 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Statuses</option>
        {APPLICATION_STATUSES.map((s) => (
          <option key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</option>
        ))}
      </select>

      <select
        value={searchParams.get("loanProductId") || ""}
        onChange={(e) => setParam("loanProductId", e.target.value)}
        className="h-10 rounded-md border border-slate-600 bg-slate-700 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Loan Types</option>
        {loanProducts.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </div>
  );
}
