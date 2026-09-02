import { WrenchIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { FichaTecnicaCard, type FichaTecnicaProduct } from "@/components/ficha-tecnica/ficha-tecnica-card";
import { PageHeader } from "@/components/page-header";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={WrenchIcon}
        title="Ficha Técnica"
        description="Consumo de filamento por SKU — edite direto no card. Cálculo automático de custo unitário entra na Fase 2."
      />

      {plainProducts.length === 0 ? (
        <EmptyState icon={WrenchIcon} message="Nenhum produto sincronizado ainda." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plainProducts.map((product) => (
            <FichaTecnicaCard key={product.sku} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
