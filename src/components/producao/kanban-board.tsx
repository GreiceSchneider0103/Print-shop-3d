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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  estoqueBaixado: boolean;
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
  const [pendingMove, setPendingMove] = useState<{ id: number; pedido: string } | null>(null);
  // No mobile, as 4 colunas empilhadas viravam uma rolagem enorme — só uma
  // coluna fica visível por vez, escolhida pelos chips abaixo. Do md pra
  // cima as 4 aparecem lado a lado como sempre.
  const [activeMobileColumn, setActiveMobileColumn] = useState(0);
  const [, startTransition] = useTransition();
  const now = new Date();

  function commitMove(id: number, status: ProductionStatus, options?: { descontarEstoque?: boolean }) {
    const previousItems = items;
    setItems((cur) => cur.map((i) => (i.id === id ? { ...i, status } : i)));

    startTransition(async () => {
      try {
        const result = await moveProductionItem(id, status, options);
        for (const warning of result.warnings) {
          toast.warning(warning);
        }
        if (status === "PRODUZIDO" && result.warnings.length === 0) {
          toast.success(
            options?.descontarEstoque === false
              ? "Produzido — estoque não foi alterado."
              : "Produzido — consumo de filamento baixado do estoque.",
          );
        }
      } catch (error) {
        setItems(previousItems);
        toast.error("Falha ao mover item", {
          description: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  function moveItem(id: number, status: ProductionStatus) {
    const current = items.find((i) => i.id === id);
    if (!current || current.status === status) return;

    if (status === "PRODUZIDO" && !current.estoqueBaixado) {
      setPendingMove({ id, pedido: current.pedido });
      return;
    }

    commitMove(id, status);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1.5 overflow-x-auto md:hidden">
        {COLUMNS.map((column, columnIndex) => {
          const count = items.filter((item) => item.status === column.status).length;
          const active = columnIndex === activeMobileColumn;
          return (
            <button
              key={column.status}
              type="button"
              onClick={() => setActiveMobileColumn(columnIndex)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
                active ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground",
              )}
            >
              <span className={cn("size-1.5 shrink-0 rounded-full", column.accent)} />
              {column.label}
              <span className={cn("tabular-nums", !active && "text-muted-foreground/70")}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((column, columnIndex) => {
          const columnItems = items.filter((item) => item.status === column.status);

          return (
            <Card
              key={column.status}
              className={cn("overflow-hidden md:flex", columnIndex === activeMobileColumn ? "flex" : "hidden")}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedId !== null) moveItem(draggedId, column.status);
              }}
            >
              <div className={cn("h-1", column.accent)} />
              <CardHeader className="pt-3 sm:pt-4">
                <CardTitle className="hidden items-center justify-between md:flex">
                  {column.label}
                  <Badge variant="outline">{columnItems.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5">
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
                        "cursor-grab rounded-md border p-1.5 text-xs leading-tight active:cursor-grabbing sm:p-2 sm:text-sm",
                        late && "border-destructive/50 bg-destructive/5",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">{item.pedido}</span>
                        <ChannelBadge canal={item.canal} className="shrink-0" />
                      </div>
                      <div className="text-muted-foreground truncate">
                        <span className="font-mono">{item.sku}</span> · {item.produto} × {item.quantidade}
                      </div>
                      {item.cliente && <div className="text-muted-foreground truncate text-xs">{item.cliente}</div>}
                      {item.prazoPostagem && (
                        <div
                          className={cn("text-xs", late ? "text-destructive font-medium" : "text-muted-foreground")}
                        >
                          {late ? "Atrasado — postar até" : "Postar até"} {formatDate(item.prazoPostagem)}
                        </div>
                      )}

                      <div className="mt-1 flex items-center justify-between sm:mt-2">
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
                          title={
                            columnIndex < COLUMNS.length - 1
                              ? `Avançar para ${COLUMNS[columnIndex + 1].label}`
                              : undefined
                          }
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

      <Dialog open={pendingMove !== null} onOpenChange={(open) => !open && setPendingMove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Baixar insumos do estoque?</DialogTitle>
            <DialogDescription>
              {pendingMove
                ? `Marcar o pedido ${pendingMove.pedido} como Produzido — deseja descontar o consumo de filamento da ficha técnica desse SKU do seu estoque?`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!pendingMove) return;
                commitMove(pendingMove.id, "PRODUZIDO", { descontarEstoque: false });
                setPendingMove(null);
              }}
            >
              Não descontar
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!pendingMove) return;
                commitMove(pendingMove.id, "PRODUZIDO", { descontarEstoque: true });
                setPendingMove(null);
              }}
            >
              Descontar estoque
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
