"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import type { ProductionQueueItem, ProductionStatus } from "@prisma/client";

import { markProducedInSheet } from "@/lib/sync/mark-production-done";

export type MoveResult = { warnings: string[] };

/**
 * Move um item da fila de produção pra outro status. Ao entrar em
 * PRODUZIDO pela primeira vez, baixa automaticamente o consumo de
 * filamento da ficha técnica do SKU (match por nome, case-insensitive).
 * `estoqueBaixado` evita baixar duas vezes se o item for movido de volta
 * e pra PRODUZIDO de novo.
 *
 * Ao chegar em POSTADO, marca a caixinha "produzido" na planilha (fora da
 * transação — é uma chamada de rede à API do Sheets, não deve travar o
 * banco enquanto espera). Falha aí não desfaz o card no Kanban, só volta
 * como aviso: a marcação na planilha é best-effort e depende da service
 * account ter permissão de Editor lá (ver `mark-production-done.ts`).
 */
export async function moveProductionItem(id: number, status: ProductionStatus): Promise<MoveResult> {
  const warnings: string[] = [];
  let item: ProductionQueueItem | undefined;

  await db.$transaction(async (tx) => {
    item = await tx.productionQueueItem.findUniqueOrThrow({ where: { id } });

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

  if (status === "POSTADO" && item) {
    try {
      const marked = await markProducedInSheet(item.pedido, item.sku);
      if (!marked) {
        warnings.push(
          `Não encontrei o pedido ${item.pedido} na aba de produção da planilha pra marcar como produzido.`,
        );
      }
    } catch (error) {
      warnings.push(
        `Não consegui marcar a caixinha na planilha (${error instanceof Error ? error.message : String(error)}). Confira se a conta de serviço tem permissão de Editor na planilha.`,
      );
    }
  }

  revalidatePath("/producao");
  revalidatePath("/estoque");
  return { warnings };
}
