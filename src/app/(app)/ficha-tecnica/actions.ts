"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";

export type RecipeEntryInput = { filamento: string; gramas: number };

/**
 * Substitui a ficha técnica inteira de um SKU pelas entradas recebidas —
 * mesma lógica de "delete o que sobrou, upsert o resto" que o job de sync
 * usa, então editar na mão e sincronizar depois não deixam lixo pra trás.
 */
export async function updateProductRecipe(sku: string, entries: RecipeEntryInput[]) {
  const valid = entries
    .map((e) => ({ filamento: e.filamento.trim(), gramas: e.gramas }))
    .filter((e) => e.filamento !== "" && Number.isFinite(e.gramas) && e.gramas > 0);

  await db.$transaction([
    db.productRecipe.deleteMany({ where: { sku } }),
    ...valid.map((entry, index) =>
      db.productRecipe.create({
        data: { sku, ordem: index + 1, filamento: entry.filamento, gramas: entry.gramas },
      }),
    ),
  ]);

  revalidatePath("/ficha-tecnica");
}
