import { FactoryIcon } from "lucide-react";

import { KanbanBoard, type KanbanItem } from "@/components/producao/kanban-board";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";

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

  const kanbanItems: KanbanItem[] = items.map((item) => ({
    id: item.id,
    pedido: item.pedido,
    cliente: item.cliente,
    sku: item.sku,
    produto: item.produto,
    quantidade: item.quantidade,
    prazoPostagem: item.prazoPostagem,
    canal: item.canal,
    status: item.status,
  }));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={FactoryIcon}
        title="Produção"
        description="Arraste os cards (ou use as setas) para mudar o status. Ao marcar como Produzido, o consumo de filamento é baixado automaticamente do estoque."
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

      <KanbanBoard items={kanbanItems} />
    </div>
  );
}
