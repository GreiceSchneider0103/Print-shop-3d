import type { ReactNode } from "react";

import { MobileTopbar } from "@/components/layout/mobile-topbar";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/sonner";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopbar />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
