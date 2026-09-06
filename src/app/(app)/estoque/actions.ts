"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import type { InventoryItemType, InventoryMovementType, MeasureUnit } from "@prisma/client";

function num(formData: FormData, key: string): number {
  return Number(formData.get(key) ?? 0) || 0;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

// ---------------------------------------------------------------------------
// Insumos — CRUD. `insumo` é a chave primária (nome), não pode ser trocado
// numa edição — o form manda o valor original num campo oculto.
// ---------------------------------------------------------------------------
export async function saveInventoryItem(formData: FormData) {
  const originalInsumo = str(formData, "originalInsumo");
  // `insumo` é a PK e o input fica desabilitado na edição, então o form não
  // manda esse campo — nunca incluir no `data` do update pra não sobrescrever
  // a chave com string vazia.
  const data = {
    tipo: str(formData, "tipo") as InventoryItemType,
    unidadeMedida: str(formData, "unidadeMedida") as MeasureUnit,
    estoqueAtualG: num(formData, "estoqueAtualG"),
    estoqueMinimoG: num(formData, "estoqueMinimoG"),
    custoPorKg: num(formData, "custoPorKg"),
    fornecedor: str(formData, "fornecedor") || null,
  };

  if (originalInsumo) {
    await db.inventoryItem.update({ where: { insumo: originalInsumo }, data });
  } else {
    await db.inventoryItem.create({ data: { ...data, insumo: str(formData, "insumo") } });
  }
  revalidatePath("/estoque");
}

export async function deleteInventoryItem(insumo: string) {
  await db.inventoryItem.delete({ where: { insumo } });
  revalidatePath("/estoque");
}

// ---------------------------------------------------------------------------
// Movimentações — ENTRADA soma, SAIDA subtrai, AJUSTE define o valor
// absoluto (contagem de estoque). Sempre grava o histórico + atualiza o
// saldo atômicamente.
// ---------------------------------------------------------------------------
export async function saveInventoryMovement(formData: FormData) {
  const insumo = str(formData, "insumo");
  const tipo = str(formData, "tipo") as InventoryMovementType;
  const quantidade = num(formData, "quantidade");
  const motivo = str(formData, "motivo") || null;
  const pedidoRelacionado = str(formData, "pedidoRelacionado") || null;

  await db.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUniqueOrThrow({ where: { insumo } });
    const estoqueAtual = Number(item.estoqueAtualG);

    const novoEstoque =
      tipo === "ENTRADA" ? estoqueAtual + quantidade : tipo === "SAIDA" ? estoqueAtual - quantidade : quantidade;

    await tx.inventoryMovement.create({
      data: { insumo, tipo, quantidade, motivo, pedidoRelacionado },
    });
    await tx.inventoryItem.update({ where: { insumo }, data: { estoqueAtualG: novoEstoque } });
  });

  revalidatePath("/estoque");
}
