import { PencilIcon, PlusIcon } from "lucide-react";
import type { InventoryItem } from "@prisma/client";

import { saveInventoryItem } from "@/app/(app)/estoque/actions";
import { FormDialog } from "@/components/configuracoes/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function Fields({ item }: { item?: InventoryItem }) {
  return (
    <>
      <input type="hidden" name="originalInsumo" defaultValue={item?.insumo ?? ""} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="insumo">Insumo</Label>
        <Input id="insumo" name="insumo" defaultValue={item?.insumo} required disabled={!!item} />
      </div>
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
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="estoqueAtualG">Estoque atual (g)</Label>
          <Input
            id="estoqueAtualG"
            name="estoqueAtualG"
            type="number"
            step="0.01"
            defaultValue={item ? Number(item.estoqueAtualG) : 0}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="estoqueMinimoG">Estoque mínimo (g)</Label>
          <Input
            id="estoqueMinimoG"
            name="estoqueMinimoG"
            type="number"
            step="0.01"
            defaultValue={item ? Number(item.estoqueMinimoG) : 0}
            required
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="custoPorKg">Custo por kg (R$)</Label>
        <Input
          id="custoPorKg"
          name="custoPorKg"
          type="number"
          step="0.01"
          defaultValue={item ? Number(item.custoPorKg) : 0}
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

export function EditInventoryItemButton({ item }: { item: InventoryItem }) {
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
