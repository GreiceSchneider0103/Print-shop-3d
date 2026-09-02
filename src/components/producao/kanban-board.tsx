"use client";

import { useState, useTransition } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { toast } from "sonner";
import type { ProductionStatus } from "@prisma/client";

import { moveProductionItem } from "@/app/(app)/producao/actions";
import { ChannelBadge } from "@/components/channel-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export type KanbanItem = {
  id: number;
  pedido: string;
  cliente: string | null;
  sku: string;
  produto: string;
  quantidade: number;
  prazoPostagem: Date | null;
  canal: string;
  status: ProductionStatus;
};

const COLUMNS: { status: ProductionStatus; label: string; accent: string }[] = [
  { status: "A_PRODUZIR", label: "A produzir", accent: "bg-amber-500" },
  { status: "EM_PRODUCAO", label: "Em produção", accent: "bg-blue-500" },
  { status: "PRODUZIDO", label: "Produzido", accent: "bg-violet-500" },
  { status: "POSTADO", label: "Postado", accent: "bg-emerald-500" },
];

export function KanbanBoard({ items: initialItems }: { items: KanbanItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const now = new Date();

  function moveItem(id: number, status: ProductionStatus) {
    const current = items.find((i) => i.id === id);
    if (!current || current.status === status) return;

    const previousItems = items;
    setItems((cur) => cur.map((i) => (i.id === id ? { ...i, status } : i)));

    startTransition(async () => {
      try {
        const result = await moveProductionItem(id, status);
        for (const warning of result.warnings) {
          toast.warning(warning);
        }
        if (status === "PRODUZIDO" && result.warnings.length === 0) {
          toast.success("Produzido — consumo de filamento baixado do estoque.");
        }
      } catch (error) {
        setItems(previousItems);
        toast.error("Falha ao mover item", {
          description: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {COLUMNS.map((column, columnIndex) => {
        const columnItems = items.filter((item) => item.status === column.status);

        return (
          <Card
            key={column.status}
            className="overflow-hidden"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (draggedId !== null) moveItem(draggedId, column.status);
            }}
          >
            <div className={cn("h-1", column.accent)} />
            <CardHeader className="pt-4">
              <CardTitle className="flex items-center justify-between">
                {column.label}
                <Badge variant="secondary">{columnItems.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {columnItems.map((item) => {
                const late =
                  (column.status === "A_PRODUZIR" || column.status === "EM_PRODUCAO") &&
                  !!item.prazoPostagem &&
                  item.prazoPostagem < now;

                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDraggedId(item.id)}
                    onDragEnd={() => setDraggedId(null)}
                    className={cn(
                      "cursor-grab rounded-md border p-2 text-sm active:cursor-grabbing",
                      late && "border-destructive/50 bg-destructive/5",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{item.pedido}</span>
                      <ChannelBadge canal={item.canal} className="shrink-0" />
                    </div>
                    <div className="text-muted-foreground font-mono text-xs">{item.sku}</div>
                    <div className="truncate">
                      {item.produto} × {item.quantidade}
                    </div>
                    {item.prazoPostagem && (
                      <div className={cn("text-xs", late ? "text-destructive font-medium" : "text-muted-foreground")}>
                        {late ? "Atrasado — postar até" : "Postar até"} {formatDate(item.prazoPostagem)}
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-between">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        disabled={columnIndex === 0}
                        onClick={() => moveItem(item.id, COLUMNS[columnIndex - 1].status)}
                        title={columnIndex > 0 ? `Voltar para ${COLUMNS[columnIndex - 1].label}` : undefined}
                      >
                        <ChevronLeftIcon className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        disabled={columnIndex === COLUMNS.length - 1}
                        onClick={() => moveItem(item.id, COLUMNS[columnIndex + 1].status)}
                        title={columnIndex < COLUMNS.length - 1 ? `Avançar para ${COLUMNS[columnIndex + 1].label}` : undefined}
                      >
                        <ChevronRightIcon className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {columnItems.length === 0 && <p className="text-muted-foreground text-xs">Nenhum item.</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
