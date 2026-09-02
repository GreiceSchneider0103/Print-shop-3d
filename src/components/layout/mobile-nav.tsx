"use client";

import { useState } from "react";
import { MenuIcon } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { SidebarBrand, SidebarNav } from "./sidebar-nav";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <MenuIcon className="size-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 sm:max-w-64">
        <SheetHeader className="sr-only">
          <SheetTitle>Menu de navegação</SheetTitle>
        </SheetHeader>
        <SidebarBrand />
        <SidebarNav onNavigate={() => setOpen(false)} />
        <div className="flex items-center justify-between border-t p-3">
          <span className="text-muted-foreground text-xs">Fase 1 — MVP</span>
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}
