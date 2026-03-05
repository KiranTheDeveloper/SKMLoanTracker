"use client";
import { Menu } from "lucide-react";
import { useMobileMenu } from "./Shell";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const toggleMenu = useMobileMenu();

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-700 bg-slate-900/95 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMenu}
          className="md:hidden text-slate-400 hover:text-white p-1"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-100">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
