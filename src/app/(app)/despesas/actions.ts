"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";

function num(formData: FormData, key: string): number {
  return Number(formData.get(key) ?? 0) || 0;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

// ---------------------------------------------------------------------------
// Despesas mensais (modelo `FixedCost` no banco — nome interno não mudou,
// só a apresentação) — total é sempre recalculado a partir dos componentes
// (mesma regra da fórmula da planilha original).
// ---------------------------------------------------------------------------
export async function saveExpense(formData: FormData) {
  const id = str(formData, "id");
  const mesInput = str(formData, "mes"); // input type="month" -> "2026-09"
  const [ano, mes] = mesInput.split("-").map(Number);

  const ads = num(formData, "ads");
  const tiny = num(formData, "tiny");
  const mei = num(formData, "mei");
  const outros = num(formData, "outros");
  const parcela = num(formData, "parcela");

  const data = {
    mes: new Date(Date.UTC(ano, mes - 1, 1)),
    ads,
    tiny,
    mei,
    outros,
    parcela,
    total: ads + tiny + mei + outros + parcela,
    reembolso: num(formData, "reembolso"),
  };

  if (id) {
    await db.fixedCost.update({ where: { id: Number(id) }, data });
  } else {
    await db.fixedCost.create({ data });
  }
  revalidatePath("/despesas");
}

export async function deleteExpense(id: number) {
  await db.fixedCost.delete({ where: { id } });
  revalidatePath("/despesas");
}
