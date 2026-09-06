import type { MeasureUnit } from "@prisma/client";

export const MEASURE_UNIT_OPTIONS: { value: MeasureUnit; label: string }[] = [
  { value: "GRAMAS", label: "Gramas (g)" },
  { value: "UNIDADE", label: "Unidade (un)" },
  { value: "METROS", label: "Metros (m)" },
];

const UNIT_SUFFIX: Record<MeasureUnit, string> = {
  GRAMAS: "g",
  UNIDADE: "un",
  METROS: "m",
};

const COST_LABEL: Record<MeasureUnit, string> = {
  GRAMAS: "Custo/kg",
  UNIDADE: "Custo/unidade",
  METROS: "Custo/metro",
};

const COST_SUFFIX: Record<MeasureUnit, string> = {
  GRAMAS: "/kg",
  UNIDADE: "/un",
  METROS: "/m",
};

export function unitSuffix(unit: MeasureUnit): string {
  return UNIT_SUFFIX[unit];
}

export function costLabel(unit: MeasureUnit): string {
  return COST_LABEL[unit];
}

export function costSuffix(unit: MeasureUnit): string {
  return COST_SUFFIX[unit];
}

export function formatQuantity(value: number, unit: MeasureUnit): string {
  return `${value.toLocaleString("pt-BR")} ${unitSuffix(unit)}`;
}

/**
 * Estimativa de custo de compra: `custoPorKg` é "por kg" só quando a
 * unidade é gramas (o insumo é contado em gramas mas comprado/precificado
 * por kg, como filamento) — nesse caso a quantidade precisa ser dividida
 * por 1000 antes de multiplicar. Pra unidade/metro, o custo já é por 1
 * unidade da própria quantidade, sem conversão.
 */
export function estimateCost(quantidade: number, custoPorMedida: number, unit: MeasureUnit): number {
  return unit === "GRAMAS" ? (quantidade / 1000) * custoPorMedida : quantidade * custoPorMedida;
}
