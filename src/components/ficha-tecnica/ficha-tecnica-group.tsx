"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";

import { FichaTecnicaRow, type FichaTecnicaProduct } from "@/components/ficha-tecnica/ficha-tecnica-row";
import { TableCell, TableRow } from "@/components/ui/table";

export function FichaTecnicaGroup({
  groupKey,
  produto,
  products,
}: {
  groupKey: string;
  produto: string;
  products: FichaTecnicaProduct[];
}) {
  const [open, setOpen] = useState(true);

  return (
    <>
      <TableRow className="bg-muted/40 hover:bg-muted/40 cursor-pointer" onClick={() => setOpen((o) => !o)}>
        <TableCell colSpan={6} className="text-muted-foreground py-1.5 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            {open ? <ChevronDownIcon className="size-3.5" /> : <ChevronRightIcon className="size-3.5" />}
            {groupKey} — {produto} · {products.length} variações
          </div>
        </TableCell>
      </TableRow>
      {open &&
        products.map((product) => (
          <FichaTecnicaRow
            key={`${product.sku}:${product.atualizadoEm}`}
            product={product}
            groupSkus={products.filter((p) => p.sku !== product.sku).map((p) => p.sku)}
          />
        ))}
    </>
  );
}
