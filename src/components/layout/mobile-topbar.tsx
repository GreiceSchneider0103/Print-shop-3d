import { Box } from "lucide-react";

import { MobileNav } from "./mobile-nav";

export function MobileTopbar() {
  return (
    <header className="flex h-14 items-center gap-2 border-b px-3 md:hidden">
      <MobileNav />
      <div className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-md">
        <Box className="size-3.5" />
      </div>
      <span className="text-sm font-semibold">Loja 3D — Gestão</span>
    </header>
  );
}
