"use client";

import { useState, useTransition } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { updateProductRecipe } from "@/app/(app)/ficha-tecnica/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { filamentColorClass } from "@/lib/filament-color";
import { formatCurrencyBRL } from "@/lib/format";

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
};

function toEntries(recipe: FichaTecnicaProduct["recipe"]): Entry[] {
  return recipe
    .slice()
    .sort((a, b) => a.ordem - b.ordem)
    .map((r) => ({ filamento: r.filamento, gramas: String(r.gramas) }));
}

export function FichaTecnicaRow({ product }: { product: FichaTecnicaProduct }) {
  const [entries, setEntries] = useState<Entry[]>(() => toEntries(product.recipe));
  const [dirty, setDirty] = useState(false);
  const [isPending, startTransition] = useTransition();

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

  function handleSave() {
    startTransition(async () => {
      try {
        await updateProductRecipe(
          product.sku,
          entries.map((e) => ({
            filamento: e.filamento,
            gramas: Number(e.gramas.replace(",", ".")) || 0,
          })),
        );
        toast.success(`Ficha técnica de ${product.sku} salva.`);
        setDirty(false);
      } catch (error) {
        toast.error("Falha ao salvar", {
          description: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  return (
    <TableRow>
      <TableCell className="align-top font-mono text-xs">{product.sku}</TableCell>
      <TableCell className="max-w-[220px] align-top text-sm font-medium">{product.produto || "—"}</TableCell>
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
      <TableCell className="align-top">{formatCurrencyBRL(product.custoUnitario)}</TableCell>
      <TableCell className="text-muted-foreground align-top">
        {product.tempoProducaoMin ? `${product.tempoProducaoMin} min` : "—"}
      </TableCell>
      <TableCell className="align-top">
        {dirty && (
          <Button size="sm" disabled={isPending} onClick={handleSave}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
