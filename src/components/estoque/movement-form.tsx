"use client";

import { ArrowRightLeftIcon } from "lucide-react";

import { saveInventoryMovement } from "@/app/(app)/estoque/actions";
import { FormDialog } from "@/components/configuracoes/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function MovementButton({ insumo }: { insumo: string }) {
  return (
    <FormDialog
      trigger={
        <Button type="button" variant="ghost" size="icon" className="size-7">
          <ArrowRightLeftIcon className="size-3.5" />
        </Button>
      }
      title={`Movimentar estoque — ${insumo}`}
      description="Entrada soma, saída subtrai, ajuste define o valor absoluto (contagem de estoque)."
      action={saveInventoryMovement}
    >
      <input type="hidden" name="insumo" defaultValue={insumo} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="movTipo">Tipo</Label>
        <Select name="tipo" defaultValue="ENTRADA">
          <SelectTrigger id="movTipo" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ENTRADA">Entrada</SelectItem>
            <SelectItem value="SAIDA">Saída</SelectItem>
            <SelectItem value="AJUSTE">Ajuste (contagem)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="quantidade">Quantidade (g)</Label>
        <Input id="quantidade" name="quantidade" type="number" step="0.01" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="motivo">Motivo</Label>
        <Input id="motivo" name="motivo" placeholder="Ex: compra, perda, contagem mensal..." />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pedidoRelacionado">Pedido relacionado (opcional)</Label>
        <Input id="pedidoRelacionado" name="pedidoRelacionado" />
      </div>
    </FormDialog>
  );
}
