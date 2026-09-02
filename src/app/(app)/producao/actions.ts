"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import type { ProductionStatus } from "@prisma/client";

export type MoveResult = { warnings: string[] };

/**
 * Move um item da fila de produção pra outro status. Ao entrar em
 * PRODUZIDO pela primeira vez, baixa automaticamente o consumo de
 * filamento da ficha técnica do SKU (match por nome, case-insensitive).
 * `estoqueBaixado` evita baixar duas vezes se o item for movido de volta
 * e pra PRODUZIDO de novo.
 */
export async function moveProductionItem(id: number, status: ProductionStatus): Promise<MoveResult> {
  const warnings: string[] = [];

  await db.$transaction(async (tx) => {
    const item = await tx.productionQueueItem.findUniqueOrThrow({ where: { id } });

    if (status === "PRODUZIDO" && !item.estoqueBaixado) {
      const recipe = await tx.productRecipe.findMany({ where: { sku: item.sku } });
      const inventoryItems = await tx.inventoryItem.findMany();
      const inventoryByKey = new Map(inventoryItems.map((inv) => [inv.insumo.trim().toLowerCase(), inv]));

      for (const entry of recipe) {
        const key = entry.filamento.trim().toLowerCase();
        const inventoryItem = inventoryByKey.get(key);
        const consumo = Number(entry.gramas) * item.quantidade;

        if (!inventoryItem) {
          warnings.push(`Filamento "${entry.filamento}" não cadastrado no estoque — baixa não aplicada.`);
          continue;
        }

        await tx.inventoryMovement.create({
          data: {
            insumo: inventoryItem.insumo,
            tipo: "SAIDA",
            quantidade: consumo,
            motivo: "Baixa automática — produção concluída",
            pedidoRelacionado: item.pedido,
          },
        });
        await tx.inventoryItem.update({
          where: { insumo: inventoryItem.insumo },
          data: { estoqueAtualG: Number(inventoryItem.estoqueAtualG) - consumo },
        });
      }

      await tx.productionQueueItem.update({ where: { id }, data: { status, estoqueBaixado: true } });
    } else {
      await tx.productionQueueItem.update({ where: { id }, data: { status } });
    }
  });

  revalidatePath("/producao");
  revalidatePath("/estoque");
  return { warnings };
}
