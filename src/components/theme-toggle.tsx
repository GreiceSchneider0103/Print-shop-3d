"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Padrão recomendado pelo próprio next-themes: o tema real só existe no
  // client (lido de localStorage/preferência do SO), então o server sempre
  // renderiza o placeholder. Sem isso dá mismatch de hidratação — checar
  // `resolvedTheme === undefined` não é suficiente porque o script inline
  // do next-themes já resolve o tema antes da hidratação terminar.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- ver comentário acima
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="size-8" aria-hidden />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
    >
      {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
    </Button>
  );
}
