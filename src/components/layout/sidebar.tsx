import { ThemeToggle } from "@/components/theme-toggle";

import { SidebarBrand, SidebarNav } from "./sidebar-nav";

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-card md:flex">
      <SidebarBrand />
      <SidebarNav />
      <div className="flex items-center justify-between border-t p-3">
        <span className="text-muted-foreground text-xs">Fase 1 — MVP</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
