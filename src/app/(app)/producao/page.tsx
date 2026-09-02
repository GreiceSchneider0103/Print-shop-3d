import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import type { ProductionStatus } from "@prisma/client";

const COLUMNS: { status: ProductionStatus; label: string }[] = [
  { status: "A_PRODUZIR", label: "A produzir" },
  { status: "EM_PRODUCAO", label: "Em produção" },
  { status: "PRODUZIDO", label: "Produzido" },
  { status: "POSTADO", label: "Postado" },
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Produção</h1>
        <p className="text-sm text-muted-foreground">
          Fila ordenada por prazo de postagem — visão somente leitura (Kanban interativo e baixa
          automática de estoque entram na Fase 2)
        </p>
      </div>

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
            <Card key={column.status}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {column.label}
                  <Badge variant="secondary">{columnItems.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {columnItems.map((item) => (
                  <div key={item.id} className="rounded-md border p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.pedido}</span>
                      <Badge variant="outline">{item.canal}</Badge>
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">{item.sku}</div>
                    <div>{item.produto} × {item.quantidade}</div>
                    {item.prazoPostagem && (
                      <div className="text-xs text-muted-foreground">
                        Postar até {formatDate(item.prazoPostagem)}
                      </div>
                    )}
                  </div>
                ))}
                {columnItems.length === 0 && (
                  <p className="text-xs text-muted-foreground">Nenhum item.</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
