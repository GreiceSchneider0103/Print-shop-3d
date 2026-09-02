"use client";

import { useTransition } from "react";
import { RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { triggerManualSync } from "@/app/(app)/configuracoes/actions";

export function SyncNowButton() {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      try {
        const summaries = await triggerManualSync();
        const hasError = summaries.some((s) => s.status === "ERROR");
        const totalProcessed = summaries.reduce((sum, s) => sum + s.processed, 0);

        if (hasError) {
          const failed = summaries.filter((s) => s.status === "ERROR").map((s) => s.tab);
          toast.error(`Sincronização com erros em: ${failed.join(", ")}`, {
            description: "Veja os detalhes na tabela abaixo.",
          });
        } else {
          toast.success(`Sincronização concluída — ${totalProcessed} registro(s) processado(s).`);
        }
      } catch (error) {
        toast.error("Falha ao sincronizar", {
          description: error instanceof Error ? error.message : String(error),
        });
      }
    });
  };

  return (
    <Button onClick={handleClick} disabled={isPending} variant="secondary" size="sm">
      <RefreshCwIcon className={cn("size-4", isPending && "animate-spin")} />
      {isPending ? "Sincronizando..." : "Sincronizar agora"}
    </Button>
  );
}
