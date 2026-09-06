"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";

export type RecipeEntryInput = { filamento: string; gramas: number };

/**
 * Cadastro manual de produto — agora que a ficha técnica não vem mais da
 * planilha (CMV), é o único jeito de dar de alta um SKU novo no sistema.
 * Custo unitário e tempo de produção começam zerados/vazios e são
 * ajustados depois direto na linha, junto com os filamentos.
 */
export async function createProduct(formData: FormData) {
  const sku = String(formData.get("sku") ?? "").trim();
  const produto = String(formData.get("produto") ?? "").trim();
  const tempoProducaoMinRaw = String(formData.get("tempoProducaoMin") ?? "").trim();

  if (!sku || !produto) {
    throw new Error("SKU e Produto são obrigatórios.");
  }

  await db.product.create({
    data: {
      sku,
      produto,
      custoUnitario: 0,
      tempoProducaoMin: tempoProducaoMinRaw ? Number(tempoProducaoMinRaw) || null : null,
    },
  });

  revalidatePath("/ficha-tecnica");
}

export type ProductUpdateInput = {
  custoUnitario: number;
  tempoProducaoMin: number | null;
  recipe: RecipeEntryInput[];
};

/**
 * Igual a `ProductUpdateInput`, com o nome do produto — usado só pra
 * salvar uma linha específica (`updateProduct`), nunca pra aplicar em
 * massa (`applyProductToGroup`): variações do mesmo produto têm nomes
 * diferentes entre si (cor/opção), copiar o nome pras outras apagaria
 * essa diferença.
 */
export type SingleProductUpdateInput = ProductUpdateInput & { produto: string };

function normalizeRecipe(entries: RecipeEntryInput[]) {
  return entries
    .map((e) => ({ filamento: e.filamento.trim(), gramas: e.gramas }))
    .filter((e) => e.filamento !== "" && Number.isFinite(e.gramas) && e.gramas > 0);
}

/**
 * Substitui nome, custo unitário, tempo de produção e a ficha técnica
 * inteira (filamentos) de um SKU — mesma lógica de "delete o que sobrou,
 * upsert o resto" pros filamentos que o job de sync usava, agora só
 * disponível pela edição em linha já que nem a Ficha Técnica nem o CMV
 * vêm mais da planilha.
 */
export async function updateProduct(sku: string, input: SingleProductUpdateInput) {
  const valid = normalizeRecipe(input.recipe);

  await db.$transaction([
    db.product.update({
      where: { sku },
      data: { produto: input.produto, custoUnitario: input.custoUnitario, tempoProducaoMin: input.tempoProducaoMin },
    }),
    db.productRecipe.deleteMany({ where: { sku } }),
    ...valid.map((entry, index) =>
      db.productRecipe.create({
        data: { sku, ordem: index + 1, filamento: entry.filamento, gramas: entry.gramas },
      }),
    ),
  ]);

  revalidatePath("/ficha-tecnica");
}

/**
 * Aplica o mesmo custo unitário, tempo de produção e filamentos pra todos
 * os SKUs do grupo de uma vez — útil quando as variações (cor, opção) do
 * mesmo produto usam a mesma receita e só o SKU/nome muda.
 */
export async function applyProductToGroup(skus: string[], input: ProductUpdateInput) {
  const valid = normalizeRecipe(input.recipe);

  await db.$transaction(
    skus.flatMap((sku) => [
      db.product.update({
        where: { sku },
        data: { custoUnitario: input.custoUnitario, tempoProducaoMin: input.tempoProducaoMin },
      }),
      db.productRecipe.deleteMany({ where: { sku } }),
      ...valid.map((entry, index) =>
        db.productRecipe.create({
          data: { sku, ordem: index + 1, filamento: entry.filamento, gramas: entry.gramas },
        }),
      ),
    ]),
  );

  revalidatePath("/ficha-tecnica");
}
