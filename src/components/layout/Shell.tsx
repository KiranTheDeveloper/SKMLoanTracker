"use client";
import { useState, createContext, useContext } from "react";
import { Sidebar } from "./Sidebar";
import { usePathname } from "next/navigation";

const MobileMenuContext = createContext<() => void>(() => {});
export function useMobileMenu() {
  return useContext(MobileMenuContext);
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Login page — no shell
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 flex flex-col min-w-0 overflow-auto">
        <MobileMenuContext.Provider value={() => setSidebarOpen((v) => !v)}>
          {children}
        </MobileMenuContext.Provider>
      </main>
    </div>
  );
}
