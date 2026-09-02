import { BoxesIcon, TriangleAlertIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { formatCurrencyBRL, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EstoquePage() {
  const items = await db.inventoryItem.findMany({ orderBy: { insumo: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={BoxesIcon}
        title="Insumos / Estoque"
        description="Necessidade de compra em tempo real e movimentações entram na Fase 2"
      />

      {items.length === 0 ? (
        <EmptyState icon={BoxesIcon} message="Nenhum insumo cadastrado ainda." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Insumo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estoque atual</TableHead>
              <TableHead>Estoque mínimo</TableHead>
              <TableHead>Custo/kg</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Atualizado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const low = Number(item.estoqueAtualG) < Number(item.estoqueMinimoG);

              return (
                <TableRow key={item.insumo} className={low ? "bg-destructive/5" : undefined}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {item.insumo}
                      {low && (
                        <Badge variant="destructive" className="gap-1">
                          <TriangleAlertIcon className="size-3" />
                          Abaixo do mínimo
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.tipo}</TableCell>
                  <TableCell className={cn(low && "text-destructive font-medium")}>
                    {Number(item.estoqueAtualG).toLocaleString("pt-BR")} g
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {Number(item.estoqueMinimoG).toLocaleString("pt-BR")} g
                  </TableCell>
                  <TableCell>{formatCurrencyBRL(item.custoPorKg.toString())}</TableCell>
                  <TableCell>{item.fornecedor ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(item.atualizadoEm)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
