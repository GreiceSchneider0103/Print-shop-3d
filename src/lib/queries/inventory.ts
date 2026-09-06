import type { MeasureUnit } from "@prisma/client";

import { db } from "@/lib/db";
import { estimateCost } from "@/lib/measure-unit";

export type PurchaseNeed = {
  insumo: string;
  unidadeMedida: MeasureUnit;
  estoqueAtualG: number;
  estoqueMinimoG: number;
  necessidadeProducaoG: number;
  necessidadeCompraG: number;
  custoPorKg: number;
  custoCompraEstimado: number;
  fornecedor: string | null;
};

export type UnmatchedRecipeInsumo = {
  filamento: string;
  necessidadeProducaoG: number;
};

/**
 * Soma o consumo de filamento da fila pendente (A produzir + Em produção)
 * por insumo, e calcula quanto falta comprar pra sobrar pelo menos o
 * estoque mínimo depois de honrar essa produção.
 */
export async function getPurchaseNeeds(): Promise<{
  needs: PurchaseNeed[];
  unmatched: UnmatchedRecipeInsumo[];
}> {
  const [pendingItems, inventoryItems] = await Promise.all([
    db.productionQueueItem.findMany({
      where: { status: { in: ["A_PRODUZIR", "EM_PRODUCAO"] } },
      select: { sku: true, quantidade: true },
    }),
    db.inventoryItem.findMany(),
  ]);

  const qtyBySku = new Map<string, number>();
  for (const item of pendingItems) {
    qtyBySku.set(item.sku, (qtyBySku.get(item.sku) ?? 0) + item.quantidade);
  }

  const recipes = await db.productRecipe.findMany({
    where: { sku: { in: Array.from(qtyBySku.keys()) } },
  });

  const neededByFilamento = new Map<string, number>();
  const displayNameByKey = new Map<string, string>();
  for (const recipe of recipes) {
    const qty = qtyBySku.get(recipe.sku) ?? 0;
    const key = recipe.filamento.trim().toLowerCase();
    neededByFilamento.set(key, (neededByFilamento.get(key) ?? 0) + Number(recipe.gramas) * qty);
    displayNameByKey.set(key, recipe.filamento);
  }

  const matchedKeys = new Set<string>();
  const needs: PurchaseNeed[] = inventoryItems.map((item) => {
    const key = item.insumo.trim().toLowerCase();
    matchedKeys.add(key);
    const necessidadeProducaoG = neededByFilamento.get(key) ?? 0;
    const estoqueAtualG = Number(item.estoqueAtualG);
    const estoqueMinimoG = Number(item.estoqueMinimoG);
    const necessidadeCompraG = Math.max(0, necessidadeProducaoG + estoqueMinimoG - estoqueAtualG);
    const custoPorKg = Number(item.custoPorKg);

    return {
      insumo: item.insumo,
      unidadeMedida: item.unidadeMedida,
      estoqueAtualG,
      estoqueMinimoG,
      necessidadeProducaoG,
      necessidadeCompraG,
      custoPorKg,
      custoCompraEstimado: estimateCost(necessidadeCompraG, custoPorKg, item.unidadeMedida),
      fornecedor: item.fornecedor,
    };
  });

  const unmatched: UnmatchedRecipeInsumo[] = Array.from(neededByFilamento.entries())
    .filter(([key]) => !matchedKeys.has(key))
    .map(([key, necessidadeProducaoG]) => ({
      filamento: displayNameByKey.get(key) ?? key,
      necessidadeProducaoG,
    }));

  needs.sort((a, b) => b.necessidadeCompraG - a.necessidadeCompraG);

  return { needs, unmatched };
}
