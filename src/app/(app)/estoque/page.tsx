import { BoxesIcon, HistoryIcon, ShoppingCartIcon, TriangleAlertIcon } from "lucide-react";

import { deleteInventoryItem } from "@/app/(app)/estoque/actions";
import { DeleteRowButton } from "@/components/configuracoes/delete-row-button";
import { EmptyState } from "@/components/empty-state";
import { AddInventoryItemButton, EditInventoryItemButton } from "@/components/estoque/inventory-item-form";
import { MovementButton } from "@/components/estoque/movement-form";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/db";
import { formatCurrencyBRL, formatDateTime } from "@/lib/format";
import { getPurchaseNeeds } from "@/lib/queries/inventory";
import { cn } from "@/lib/utils";

const MOVEMENT_LABEL = { ENTRADA: "Entrada", SAIDA: "Saída", AJUSTE: "Ajuste" } as const;

export const dynamic = "force-dynamic";

export default async function EstoquePage() {
  const [items, movements, { needs, unmatched }] = await Promise.all([
    db.inventoryItem.findMany({ orderBy: { insumo: "asc" } }),
    db.inventoryMovement.findMany({ orderBy: { data: "desc" }, take: 30 }),
    getPurchaseNeeds(),
  ]);

  const purchaseRows = needs.filter((n) => n.necessidadeCompraG > 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={BoxesIcon}
        title="Insumos / Estoque"
        description="Saldo por insumo, necessidade de compra calculada a partir da fila de produção e histórico de movimentações."
      />

      <Tabs defaultValue="insumos">
        <TabsList>
          <TabsTrigger value="insumos">
            <BoxesIcon />
            Insumos
          </TabsTrigger>
          <TabsTrigger value="necessidade">
            <ShoppingCartIcon />
            Necessidade de compra
          </TabsTrigger>
          <TabsTrigger value="movimentacoes">
            <HistoryIcon />
            Movimentações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insumos" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <AddInventoryItemButton />
          </div>

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
                  <TableHead className="text-right">Ações</TableHead>
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
                      <TableCell className="text-muted-foreground">{formatDateTime(item.atualizadoEm)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <MovementButton insumo={item.insumo} />
                          <EditInventoryItemButton item={item} />
                          <DeleteRowButton
                            action={deleteInventoryItem.bind(null, item.insumo)}
                            confirmMessage={`Excluir o insumo ${item.insumo}? O histórico de movimentações também será apagado.`}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="necessidade" className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            Considera o consumo de filamento da fila de produção pendente (A produzir + Em produção) contra o
            estoque atual, garantindo que sobre pelo menos o estoque mínimo configurado.
          </p>

          {purchaseRows.length === 0 && unmatched.length === 0 ? (
            <EmptyState icon={ShoppingCartIcon} message="Nenhuma compra necessária no momento." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Insumo</TableHead>
                  <TableHead>Estoque atual</TableHead>
                  <TableHead>Necessário p/ produção pendente</TableHead>
                  <TableHead>Comprar</TableHead>
                  <TableHead>Custo estimado</TableHead>
                  <TableHead>Fornecedor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseRows.map((n) => (
                  <TableRow key={n.insumo}>
                    <TableCell className="font-medium">{n.insumo}</TableCell>
                    <TableCell>{n.estoqueAtualG.toLocaleString("pt-BR")} g</TableCell>
                    <TableCell>{n.necessidadeProducaoG.toLocaleString("pt-BR")} g</TableCell>
                    <TableCell className="text-destructive font-medium">
                      {n.necessidadeCompraG.toLocaleString("pt-BR")} g
                    </TableCell>
                    <TableCell>{formatCurrencyBRL(n.custoCompraEstimado)}</TableCell>
                    <TableCell>{n.fornecedor ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {unmatched.map((u) => (
                  <TableRow key={u.filamento} className="bg-amber-500/5">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {u.filamento}
                        <Badge variant="warning" className="gap-1">
                          <TriangleAlertIcon className="size-3" />
                          Sem cadastro no estoque
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      Precisa de {u.necessidadeProducaoG.toLocaleString("pt-BR")} g pra fila pendente — cadastre
                      este insumo na aba &quot;Insumos&quot; pra acompanhar o estoque.
                    </TableCell>
                    <TableCell>—</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="movimentacoes">
          {movements.length === 0 ? (
            <EmptyState icon={HistoryIcon} message="Nenhuma movimentação registrada ainda." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Insumo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Pedido relacionado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-muted-foreground">{formatDateTime(m.data)}</TableCell>
                    <TableCell className="font-medium">{m.insumo}</TableCell>
                    <TableCell>
                      <Badge
                        variant={m.tipo === "SAIDA" ? "destructive" : m.tipo === "ENTRADA" ? "success" : "secondary"}
                      >
                        {MOVEMENT_LABEL[m.tipo]}
                      </Badge>
                    </TableCell>
                    <TableCell>{Number(m.quantidade).toLocaleString("pt-BR")} g</TableCell>
                    <TableCell className="text-muted-foreground">{m.motivo ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{m.pedidoRelacionado ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
