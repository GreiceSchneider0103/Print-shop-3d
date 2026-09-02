import { FactoryIcon } from "lucide-react";

import { ChannelBadge } from "@/components/channel-badge";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductionStatus } from "@prisma/client";

const COLUMNS: { status: ProductionStatus; label: string; accent: string }[] = [
  { status: "A_PRODUZIR", label: "A produzir", accent: "bg-amber-500" },
  { status: "EM_PRODUCAO", label: "Em produção", accent: "bg-blue-500" },
  { status: "PRODUZIDO", label: "Produzido", accent: "bg-violet-500" },
  { status: "POSTADO", label: "Postado", accent: "bg-emerald-500" },
];

export const dynamic = "force-dynamic";

export default async function ProducaoPage() {
  const items = await db.productionQueueItem.findMany({
    orderBy: [{ prazoPostagem: "asc" }, { criadoEm: "asc" }],
  });

  const bySku = new Map<string, number>();
  for (const item of items) {
    if (item.status === "A_PRODUZIR" || item.status === "EM_PRODUCAO") {
      bySku.set(item.sku, (bySku.get(item.sku) ?? 0) + item.quantidade);
    }
  }

  const now = new Date();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={FactoryIcon}
        title="Produção"
        description="Fila ordenada por prazo de postagem — visão somente leitura (Kanban interativo e baixa automática de estoque entram na Fase 2)"
      />

      {bySku.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Agrupado por SKU pendente</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Array.from(bySku.entries()).map(([sku, qtd]) => (
              <Badge key={sku} variant="outline" className="font-mono">
                {sku} × {qtd}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((column) => {
          const columnItems = items.filter((item) => item.status === column.status);

          return (
            <Card key={column.status} className="overflow-hidden">
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
                      className={cn("rounded-md border p-2 text-sm", late && "border-destructive/50 bg-destructive/5")}
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
                    </div>
                  );
                })}
                {columnItems.length === 0 && <p className="text-muted-foreground text-xs">Nenhum item.</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
