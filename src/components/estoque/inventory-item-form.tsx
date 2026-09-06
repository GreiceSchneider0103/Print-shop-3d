"use client";

import { useState } from "react";
import { PencilIcon, PlusIcon } from "lucide-react";
import type { InventoryItemType, MeasureUnit } from "@prisma/client";

import { saveInventoryItem } from "@/app/(app)/estoque/actions";
import { FormDialog } from "@/components/configuracoes/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { costLabel, MEASURE_UNIT_OPTIONS, unitSuffix } from "@/lib/measure-unit";

/**
 * Só campos simples (sem `Decimal` do Prisma, que não serializa de Server
 * para Client Component) — a página converte antes de passar pra cá.
 */
export type PlainInventoryItem = {
  insumo: string;
  tipo: InventoryItemType;
  unidadeMedida: MeasureUnit;
  estoqueAtualG: number;
  estoqueMinimoG: number;
  custoPorKg: number;
  fornecedor: string | null;
};

function Fields({ item }: { item?: PlainInventoryItem }) {
  const [unidadeMedida, setUnidadeMedida] = useState<MeasureUnit>(item?.unidadeMedida ?? "GRAMAS");

  return (
    <>
      <input type="hidden" name="originalInsumo" defaultValue={item?.insumo ?? ""} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="insumo">Insumo</Label>
        <Input id="insumo" name="insumo" defaultValue={item?.insumo} required disabled={!!item} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tipo">Tipo</Label>
          <Select name="tipo" defaultValue={item?.tipo ?? "FILAMENTO"}>
            <SelectTrigger id="tipo" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FILAMENTO">Filamento</SelectItem>
              <SelectItem value="OUTRO">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="unidadeMedida">Unidade de medida</Label>
          <Select
            name="unidadeMedida"
            defaultValue={unidadeMedida}
            onValueChange={(value) => setUnidadeMedida(value as MeasureUnit)}
          >
            <SelectTrigger id="unidadeMedida" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEASURE_UNIT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="estoqueAtualG">Estoque atual ({unitSuffix(unidadeMedida)})</Label>
          <Input
            id="estoqueAtualG"
            name="estoqueAtualG"
            type="number"
            step="0.01"
            defaultValue={item?.estoqueAtualG ?? 0}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="estoqueMinimoG">Estoque mínimo ({unitSuffix(unidadeMedida)})</Label>
          <Input
            id="estoqueMinimoG"
            name="estoqueMinimoG"
            type="number"
            step="0.01"
            defaultValue={item?.estoqueMinimoG ?? 0}
            required
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="custoPorKg">{costLabel(unidadeMedida)} (R$)</Label>
        <Input
          id="custoPorKg"
          name="custoPorKg"
          type="number"
          step="0.01"
          defaultValue={item?.custoPorKg ?? 0}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fornecedor">Fornecedor</Label>
        <Input id="fornecedor" name="fornecedor" defaultValue={item?.fornecedor ?? ""} />
      </div>
    </>
  );
}

export function AddInventoryItemButton() {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="secondary">
          <PlusIcon />
          Novo insumo
        </Button>
      }
      title="Novo insumo"
      action={saveInventoryItem}
    >
      <Fields />
    </FormDialog>
  );
}

export function EditInventoryItemButton({ item }: { item: PlainInventoryItem }) {
  return (
    <FormDialog
      trigger={
        <Button type="button" variant="ghost" size="icon" className="size-7">
          <PencilIcon className="size-3.5" />
        </Button>
      }
      title={`Editar insumo — ${item.insumo}`}
      action={saveInventoryItem}
    >
      <Fields item={item} />
    </FormDialog>
  );
}
