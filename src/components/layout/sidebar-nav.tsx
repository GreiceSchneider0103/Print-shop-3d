"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, ExternalLinkIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { NAV_SECTIONS } from "./nav-items";

export function SidebarBrand() {
  return (
    <div className="flex h-14 items-center gap-2 border-b px-4">
      <div className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-md">
        <Box className="size-4" />
      </div>
      <span className="text-sm font-semibold">Loja 3D — Gestão</span>
    </div>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-3 overflow-y-auto p-2">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="flex flex-col gap-1">
          <span className="text-muted-foreground/70 px-3 text-[10px] font-semibold tracking-wider uppercase">
            {section.label}
          </span>
          {section.items.map((item) => {
            const active = !item.external && (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));
            const Icon = item.icon;
            const linkClassName = cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            );

            if (item.external) {
              return (
                <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className={linkClassName}>
                  <Icon className="size-4" />
                  {item.label}
                  <ExternalLinkIcon className="ml-auto size-3.5 shrink-0" />
                </a>
              );
            }

            return (
              <Link key={item.href} href={item.href} onClick={onNavigate} className={linkClassName}>
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
