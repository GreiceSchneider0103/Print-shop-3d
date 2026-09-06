import { WrenchIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { CreateProductButton } from "@/components/ficha-tecnica/create-product-button";
import { FichaTecnicaGroup } from "@/components/ficha-tecnica/ficha-tecnica-group";
import { FichaTecnicaRow, type FichaTecnicaProduct } from "@/components/ficha-tecnica/ficha-tecnica-row";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Código-base do produto — os dígitos no início do SKU. Variações de
 * cor/opção do mesmo produto compartilham esse prefixo, mas nem sempre com
 * separador consistente na planilha original (`0007-Branco com Dourado`,
 * mas também `0002Branco`/`0002Preto` e `0003a`/`0003b`) — por isso pega só
 * os dígitos, não corta no primeiro "-".
 */
function groupKey(sku: string): string {
  return sku.match(/^\d+/)?.[0] || sku;
}

export default async function FichaTecnicaPage() {
  const products = await db.product.findMany({
    include: { recipe: { orderBy: { ordem: "asc" } } },
    orderBy: { sku: "asc" },
  });

  // Prisma `Decimal` não serializa de Server para Client Component — só
  // campos simples seguem adiante (ver `FichaTecnicaProduct`).
  const plainProducts: FichaTecnicaProduct[] = products.map((p) => ({
    sku: p.sku,
    produto: p.produto,
    custoUnitario: Number(p.custoUnitario),
    tempoProducaoMin: p.tempoProducaoMin,
    recipe: p.recipe.map((r) => ({ filamento: r.filamento, gramas: Number(r.gramas), ordem: r.ordem })),
    atualizadoEm: p.atualizadoEm.getTime(),
  }));

  const groups = new Map<string, FichaTecnicaProduct[]>();
  for (const product of plainProducts) {
    const key = groupKey(product.sku);
    const group = groups.get(key);
    if (group) group.push(product);
    else groups.set(key, [product]);
  }

  // Grupos de verdade (mais de uma variação) primeiro, SKUs avulsos depois
  // — senão um SKU sem grupo intercalado alfabeticamente quebra a leitura
  // visual dos grupos.
  const byKeyAsc = ([a]: [string, FichaTecnicaProduct[]], [b]: [string, FichaTecnicaProduct[]]) => a.localeCompare(b);
  const entries = Array.from(groups.entries());
  const sortedGroups = [
    ...entries.filter(([, group]) => group.length > 1).sort(byKeyAsc),
    ...entries.filter(([, group]) => group.length === 1).sort(byKeyAsc),
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={WrenchIcon}
        title="Ficha Técnica"
        description="Consumo de filamento por SKU, agrupado por produto — edite direto na linha ou cadastre um SKU novo."
        actions={<CreateProductButton />}
      />

      {plainProducts.length === 0 ? (
        <EmptyState icon={WrenchIcon} message="Nenhum produto cadastrado ainda." />
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Filamentos</TableHead>
                <TableHead>Custo unitário</TableHead>
                <TableHead>Tempo de produção</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedGroups.map(([key, group]) =>
                group.length > 1 ? (
                  <FichaTecnicaGroup key={key} groupKey={key} produto={group[0].produto} products={group} />
                ) : (
                  <FichaTecnicaRow key={`${group[0].sku}:${group[0].atualizadoEm}`} product={group[0]} />
                ),
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
