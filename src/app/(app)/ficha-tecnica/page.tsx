import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatCurrencyBRL } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FichaTecnicaPage() {
  const products = await db.product.findMany({
    include: { recipe: { orderBy: { ordem: "asc" } } },
    orderBy: { sku: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Ficha Técnica</h1>
        <p className="text-sm text-muted-foreground">
          Consumo de filamento por SKU — cálculo automático de custo unitário entra na Fase 2
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <Card key={product.sku}>
            <CardHeader>
              <CardTitle className="flex flex-col gap-0.5">
                <span className="font-mono text-xs text-muted-foreground">{product.sku}</span>
                <span className="text-sm font-semibold text-foreground">{product.produto}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {product.recipe.length === 0 && (
                <p className="text-xs text-muted-foreground">Sem ficha técnica cadastrada.</p>
              )}
              {product.recipe.map((r) => (
                <div key={r.id} className="flex items-center justify-between">
                  <span>{r.filamento}</span>
                  <span className="text-muted-foreground">{Number(r.gramas)} g</span>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
                <span>Custo unitário cadastrado</span>
                <span>{formatCurrencyBRL(product.custoUnitario.toString())}</span>
              </div>
              {product.tempoProducaoMin && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Tempo de produção</span>
                  <span>{product.tempoProducaoMin} min</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {products.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum produto sincronizado ainda.</p>
        )}
      </div>
    </div>
  );
}
