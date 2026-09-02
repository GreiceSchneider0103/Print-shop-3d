/**
 * Mapeia o nome do filamento (ex.: "PLA Branco", "PLA Azul") para uma cor
 * de apoio visual — só para dar uma pista rápida na UI, não precisa ser
 * exata. Nome desconhecido cai num cinza neutro.
 */
const COLOR_KEYWORDS: [RegExp, string][] = [
  [/branco/i, "bg-neutral-100 border-neutral-300"],
  [/preto/i, "bg-neutral-900"],
  [/cinza/i, "bg-neutral-400"],
  [/dourado|ouro/i, "bg-amber-400"],
  [/prata/i, "bg-slate-300"],
  [/vermelho/i, "bg-red-500"],
  [/laranja/i, "bg-orange-500"],
  [/amarelo/i, "bg-yellow-400"],
  [/verde/i, "bg-emerald-500"],
  [/azul/i, "bg-blue-500"],
  [/roxo|violeta/i, "bg-violet-500"],
  [/rosa|pink/i, "bg-pink-400"],
  [/marrom/i, "bg-amber-800"],
];

export function filamentColorClass(filamento: string): string {
  return COLOR_KEYWORDS.find(([re]) => re.test(filamento))?.[1] ?? "bg-muted border-border";
}
