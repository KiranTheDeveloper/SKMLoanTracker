"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, Users, FileText, Bell, BarChart2,
  UserCog, X, LogOut,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/applications", label: "Applications", icon: FileText },
  { href: "/reminders", label: "Reminders", icon: Bell },
  { href: "/reports", label: "Reports", icon: BarChart2 },
];

const adminNavItems = [
  { href: "/team", label: "Team", icon: UserCog },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const allNav = isAdmin ? [...navItems, ...adminNavItems] : navItems;

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 w-60 bg-slate-900 text-white flex flex-col",
        "transition-transform duration-200 ease-in-out",
        "md:relative md:translate-x-0 md:z-auto md:flex-shrink-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Logo */}
      <div className="p-5 border-b border-slate-700 flex items-center justify-between">
        <Image src="/logo.svg" alt="SKM LoanTrack" width={160} height={44} priority />
        <button
          onClick={onClose}
          className="md:hidden text-slate-400 hover:text-white p-1"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {allNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      {session?.user && (
        <div className="p-3 border-t border-slate-700">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <Avatar className="w-7 h-7 flex-shrink-0">
              <AvatarFallback className="text-xs">
                {session.user.name?.slice(0, 2).toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{session.user.name}</p>
              <p className="text-xs text-slate-500 truncate">{session.user.role}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-slate-400 hover:text-red-400 transition-colors p-1"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
