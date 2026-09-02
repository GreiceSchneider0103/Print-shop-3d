import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Cores por canal para leitura rápida nas tabelas — mantém o nome real do
 * canal (vindo da planilha) como texto, só estiliza por palavra-chave
 * conhecida. Canal novo/desconhecido cai no estilo neutro (outline).
 */
const CHANNEL_STYLES: { match: RegExp; className: string }[] = [
  { match: /shopee/i, className: "border-transparent bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300" },
  { match: /mercado\s*livre/i, className: "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300" },
  { match: /tiktok/i, className: "border-transparent bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-500/15 dark:text-fuchsia-300" },
  { match: /whatsapp|loja\s*f[ií]sica/i, className: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300" },
];

export function ChannelBadge({ canal, className }: { canal: string; className?: string }) {
  const style = CHANNEL_STYLES.find((s) => s.match.test(canal));

  return (
    <Badge variant={style ? undefined : "outline"} className={cn(style?.className, className)}>
      {canal}
    </Badge>
  );
}
