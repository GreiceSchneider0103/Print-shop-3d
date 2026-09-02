import { WrenchIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { filamentColorClass } from "@/lib/filament-color";
import { formatCurrencyBRL } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FichaTecnicaPage() {
  const products = await db.product.findMany({
    include: { recipe: { orderBy: { ordem: "asc" } } },
    orderBy: { sku: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={WrenchIcon}
        title="Ficha Técnica"
        description="Consumo de filamento por SKU — cálculo automático de custo unitário entra na Fase 2"
      />

      {products.length === 0 ? (
        <EmptyState icon={WrenchIcon} message="Nenhum produto sincronizado ainda." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <Card key={product.sku}>
              <CardHeader>
                <CardTitle className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground font-mono text-xs">{product.sku}</span>
                  <span className="text-foreground text-sm font-semibold">{product.produto}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                {product.recipe.length === 0 && (
                  <p className="text-muted-foreground text-xs">Sem ficha técnica cadastrada.</p>
                )}
                {product.recipe.map((r) => (
                  <div key={r.id} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className={`size-2.5 shrink-0 rounded-full border ${filamentColorClass(r.filamento)}`} />
                      {r.filamento}
                    </span>
                    <span className="text-muted-foreground">{Number(r.gramas)} g</span>
                  </div>
                ))}
                <div className="text-muted-foreground mt-2 flex items-center justify-between border-t pt-2 text-xs">
                  <span>Custo unitário cadastrado</span>
                  <span>{formatCurrencyBRL(product.custoUnitario.toString())}</span>
                </div>
                {product.tempoProducaoMin && (
                  <div className="text-muted-foreground flex items-center justify-between text-xs">
                    <span>Tempo de produção</span>
                    <span>{product.tempoProducaoMin} min</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
