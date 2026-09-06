import { Fragment } from "react";
import { WrenchIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { CreateProductButton } from "@/components/ficha-tecnica/create-product-button";
import { FichaTecnicaRow, type FichaTecnicaProduct } from "@/components/ficha-tecnica/ficha-tecnica-row";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Código-base do produto (antes do primeiro "-") — variações de cor/opção do mesmo produto compartilham esse prefixo. */
function groupKey(sku: string): string {
  return sku.split("-")[0] || sku;
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
  }));

  const groups = new Map<string, FichaTecnicaProduct[]>();
  for (const product of plainProducts) {
    const key = groupKey(product.sku);
    const group = groups.get(key);
    if (group) group.push(product);
    else groups.set(key, [product]);
  }
  const sortedGroups = Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));

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
                <TableHead>Custo unitário cadastrado</TableHead>
                <TableHead>Tempo de produção</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedGroups.map(([key, group]) => (
                <Fragment key={key}>
                  {group.length > 1 && (
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableCell colSpan={6} className="text-muted-foreground py-1.5 text-xs font-semibold">
                        {key} — {group[0].produto}
                      </TableCell>
                    </TableRow>
                  )}
                  {group.map((product) => (
                    <FichaTecnicaRow key={product.sku} product={product} />
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
