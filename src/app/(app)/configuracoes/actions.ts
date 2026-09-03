"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { runFullSync, type SyncSummary } from "@/lib/sync/run";

export async function triggerManualSync(): Promise<SyncSummary[]> {
  const summaries = await runFullSync();
  // Sincronização atualiza dados usados por quase todas as páginas
  // (Dashboard, Vendas, Produtos, Produção, Ficha Técnica...), não só
  // Configurações — revalida o layout inteiro pra tudo refletir na hora,
  // não importa de qual página o botão "Sincronizar agora" foi clicado.
  revalidatePath("/", "layout");
  return summaries;
}

function num(formData: FormData, key: string): number {
  return Number(formData.get(key) ?? 0) || 0;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

// ---------------------------------------------------------------------------
// Taxas por canal
// ---------------------------------------------------------------------------
export async function saveChannelFee(formData: FormData) {
  const id = str(formData, "id");
  const data = {
    canal: str(formData, "canal"),
    valorMin: num(formData, "valorMin"),
    valorMax: num(formData, "valorMax"),
    comissaoPct: num(formData, "comissaoPct") / 100,
    taxaFixa: num(formData, "taxaFixa"),
    observacao: str(formData, "observacao") || null,
  };

  if (id) {
    await db.channelFee.update({ where: { id: Number(id) }, data });
  } else {
    await db.channelFee.create({ data });
  }
  revalidatePath("/configuracoes");
}

export async function deleteChannelFee(id: number) {
  await db.channelFee.delete({ where: { id } });
  revalidatePath("/configuracoes");
}

// ---------------------------------------------------------------------------
// Custos fixos — total é sempre recalculado a partir dos componentes
// (mesma regra da fórmula da planilha original).
// ---------------------------------------------------------------------------
export async function saveFixedCost(formData: FormData) {
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
  revalidatePath("/configuracoes");
}

export async function deleteFixedCost(id: number) {
  await db.fixedCost.delete({ where: { id } });
  revalidatePath("/configuracoes");
}

// ---------------------------------------------------------------------------
// Config Operação — guardado como histórico (mesma regra do sync): salvar
// sempre cria uma nova linha vigente, nunca edita uma antiga.
// custoEnergiaHora é derivado, nunca vem de input do usuário.
// ---------------------------------------------------------------------------
export async function saveOperationConfig(formData: FormData) {
  const potenciaImpressora = num(formData, "potenciaImpressora");
  const tarifaEnergia = num(formData, "tarifaEnergia");

  await db.operationConfig.create({
    data: {
      potenciaImpressora,
      tarifaEnergia,
      custoEnergiaHora: (potenciaImpressora / 1000) * tarifaEnergia,
      maoObraHora: num(formData, "maoObraHora"),
      depreciacaoManutencao: num(formData, "depreciacaoManutencao"),
    },
  });
  revalidatePath("/configuracoes");
}

// ---------------------------------------------------------------------------
// Prazos por canal
// ---------------------------------------------------------------------------
export async function saveDeadline(formData: FormData) {
  const id = str(formData, "id");
  const data = {
    canal: str(formData, "canal"),
    diasUteisPrazo: Math.round(num(formData, "diasUteisPrazo")),
    observacao: str(formData, "observacao") || null,
  };

  if (id) {
    await db.deadline.update({ where: { id: Number(id) }, data });
  } else {
    await db.deadline.create({ data });
  }
  revalidatePath("/configuracoes");
}

export async function deleteDeadline(id: number) {
  await db.deadline.delete({ where: { id } });
  revalidatePath("/configuracoes");
}

// ---------------------------------------------------------------------------
// Meta de faturamento mensal — singleton (id sempre 1), não vem da planilha.
// ---------------------------------------------------------------------------
export async function saveRevenueGoal(formData: FormData) {
  await db.revenueGoal.upsert({
    where: { id: 1 },
    create: { id: 1, metaMensal: num(formData, "metaMensal") },
    update: { metaMensal: num(formData, "metaMensal") },
  });
  revalidatePath("/configuracoes");
  revalidatePath("/mensal");
  revalidatePath("/");
}
