"use client";

import { useState, useTransition } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { applyProductToGroup, updateProduct } from "@/app/(app)/ficha-tecnica/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { filamentColorClass } from "@/lib/filament-color";

type Entry = { filamento: string; gramas: string };

/**
 * Só campos simples (sem `Decimal` do Prisma, que não serializa de Server
 * para Client Component) — a página converte antes de passar pra cá.
 */
export type FichaTecnicaProduct = {
  sku: string;
  produto: string;
  custoUnitario: number;
  tempoProducaoMin: number | null;
  recipe: { filamento: string; gramas: number; ordem: number }[];
  /** `Product.atualizadoEm` como timestamp — usado na `key` de fora pra forçar
   * o React a remontar a linha (e descartar o estado local antigo) quando o
   * dado muda por outro caminho, como "aplicar a todo o grupo" mexendo numa
   * linha irmã. Sem isso, a linha irmã mantém os valores antigos no estado
   * local mesmo depois do servidor confirmar a mudança. */
  atualizadoEm: number;
};

function toEntries(recipe: FichaTecnicaProduct["recipe"]): Entry[] {
  return recipe
    .slice()
    .sort((a, b) => a.ordem - b.ordem)
    .map((r) => ({ filamento: r.filamento, gramas: String(r.gramas) }));
}

/**
 * `groupSkus`: os outros SKUs do mesmo grupo (variações de cor/opção do
 * mesmo produto) — quando presente, mostra o botão "Aplicar a todo o
 * grupo" pra copiar custo, tempo e filamentos desta linha pras outras.
 */
export function FichaTecnicaRow({ product, groupSkus = [] }: { product: FichaTecnicaProduct; groupSkus?: string[] }) {
  const [entries, setEntries] = useState<Entry[]>(() => toEntries(product.recipe));
  const [produto, setProduto] = useState(product.produto);
  const [custoUnitario, setCustoUnitario] = useState(String(product.custoUnitario));
  const [tempoProducaoMin, setTempoProducaoMin] = useState(String(product.tempoProducaoMin ?? ""));
  const [dirty, setDirty] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isApplyingToGroup, startApplyToGroup] = useTransition();

  function updateEntry(index: number, field: keyof Entry, value: string) {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
    setDirty(true);
  }

  function addEntry() {
    setEntries((prev) => [...prev, { filamento: "", gramas: "" }]);
    setDirty(true);
  }

  function removeEntry(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  }

  /** Custo, tempo e filamentos — os únicos campos que fazem sentido copiar pras outras variações do grupo (nome não, cada variação tem o seu). */
  function buildGroupInput() {
    return {
      custoUnitario: Number(custoUnitario.replace(",", ".")) || 0,
      tempoProducaoMin: tempoProducaoMin.trim() ? Number(tempoProducaoMin) || null : null,
      recipe: entries.map((e) => ({
        filamento: e.filamento,
        gramas: Number(e.gramas.replace(",", ".")) || 0,
      })),
    };
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await updateProduct(product.sku, { ...buildGroupInput(), produto });
        toast.success(`Ficha técnica de ${product.sku} salva.`);
        setDirty(false);
      } catch (error) {
        toast.error("Falha ao salvar", {
          description: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  function handleApplyToGroup() {
    startApplyToGroup(async () => {
      try {
        await applyProductToGroup([product.sku, ...groupSkus], buildGroupInput());
        toast.success(`Custo, tempo e filamentos aplicados às ${groupSkus.length + 1} variações do grupo.`);
        setDirty(false);
      } catch (error) {
        toast.error("Falha ao aplicar ao grupo", {
          description: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  return (
    <TableRow>
      <TableCell className="align-top font-mono text-xs">{product.sku}</TableCell>
      <TableCell className="align-top">
        <Input
          value={produto}
          onChange={(e) => {
            setProduto(e.target.value);
            setDirty(true);
          }}
          placeholder="Nome do produto"
          className="h-8 w-52 text-sm font-medium"
        />
      </TableCell>
      <TableCell className="align-top">
        <div className="flex min-w-[280px] flex-col gap-1.5">
          {entries.length === 0 && <p className="text-muted-foreground text-xs">Sem filamento cadastrado.</p>}
          {entries.map((entry, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <span className={`size-2.5 shrink-0 rounded-full border ${filamentColorClass(entry.filamento)}`} />
              <Input
                value={entry.filamento}
                onChange={(e) => updateEntry(index, "filamento", e.target.value)}
                placeholder="Filamento (ex: PLA Branco)"
                className="h-8 flex-1 text-sm"
              />
              <Input
                value={entry.gramas}
                onChange={(e) => updateEntry(index, "gramas", e.target.value)}
                type="number"
                step="0.1"
                placeholder="g"
                className="h-8 w-16 text-sm"
              />
              <span className="text-muted-foreground w-3 text-xs">g</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive size-7 shrink-0"
                onClick={() => removeEntry(index)}
              >
                <XIcon className="size-3.5" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={addEntry}>
            <PlusIcon className="size-3.5" />
            Filamento
          </Button>
        </div>
      </TableCell>
      <TableCell className="align-top">
        <Input
          value={custoUnitario}
          onChange={(e) => {
            setCustoUnitario(e.target.value);
            setDirty(true);
          }}
          type="number"
          step="0.01"
          className="h-8 w-24 text-sm"
        />
      </TableCell>
      <TableCell className="align-top">
        <div className="flex items-center gap-1.5">
          <Input
            value={tempoProducaoMin}
            onChange={(e) => {
              setTempoProducaoMin(e.target.value);
              setDirty(true);
            }}
            type="number"
            step="1"
            placeholder="min"
            className="h-8 w-20 text-sm"
          />
          <span className="text-muted-foreground text-xs">min</span>
        </div>
      </TableCell>
      <TableCell className="max-w-[160px] align-top whitespace-normal">
        {dirty && (
          <div className="flex flex-col items-start gap-1.5">
            <Button size="sm" disabled={isPending} onClick={handleSave}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
            {groupSkus.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-muted-foreground h-auto w-36 justify-start p-0 text-left text-xs font-normal whitespace-normal underline-offset-2 hover:underline"
                disabled={isApplyingToGroup}
                onClick={handleApplyToGroup}
              >
                {isApplyingToGroup ? "Aplicando..." : `Aplicar às ${groupSkus.length} outras variações do grupo`}
              </Button>
            )}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
