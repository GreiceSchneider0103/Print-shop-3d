import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { formatCurrencyBRL, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EstoquePage() {
  const items = await db.inventoryItem.findMany({ orderBy: { insumo: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Insumos / Estoque</h1>
        <p className="text-sm text-muted-foreground">
          Necessidade de compra em tempo real e movimentações entram na Fase 2
        </p>
      </div>

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
              <TableRow key={item.insumo}>
                <TableCell className="font-medium">
                  {item.insumo}
                  {low && (
                    <Badge variant="destructive" className="ml-2">
                      Abaixo do mínimo
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{item.tipo}</TableCell>
                <TableCell>{Number(item.estoqueAtualG).toLocaleString("pt-BR")} g</TableCell>
                <TableCell>{Number(item.estoqueMinimoG).toLocaleString("pt-BR")} g</TableCell>
                <TableCell>{formatCurrencyBRL(item.custoPorKg.toString())}</TableCell>
                <TableCell>{item.fornecedor ?? "—"}</TableCell>
                <TableCell>{formatDate(item.atualizadoEm)}</TableCell>
              </TableRow>
            );
          })}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Nenhum insumo cadastrado ainda.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
