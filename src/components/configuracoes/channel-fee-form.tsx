import { PencilIcon, PlusIcon } from "lucide-react";
import type { ChannelFee } from "@prisma/client";

import { saveChannelFee } from "@/app/(app)/configuracoes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { FormDialog } from "./form-dialog";

function Fields({ fee }: { fee?: ChannelFee }) {
  return (
    <>
      {fee && <input type="hidden" name="id" defaultValue={fee.id} />}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="canal">Canal</Label>
        <Input id="canal" name="canal" defaultValue={fee?.canal} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="valorMin">Valor mínimo (R$)</Label>
          <Input
            id="valorMin"
            name="valorMin"
            type="number"
            step="0.01"
            defaultValue={fee ? Number(fee.valorMin) : 0}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="valorMax">Valor máximo (R$)</Label>
          <Input
            id="valorMax"
            name="valorMax"
            type="number"
            step="0.01"
            defaultValue={fee ? Number(fee.valorMax) : 999999}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="comissaoPct">Comissão (%)</Label>
          <Input
            id="comissaoPct"
            name="comissaoPct"
            type="number"
            step="0.01"
            defaultValue={fee ? Number(fee.comissaoPct) * 100 : 0}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="taxaFixa">Taxa fixa (R$)</Label>
          <Input
            id="taxaFixa"
            name="taxaFixa"
            type="number"
            step="0.01"
            defaultValue={fee ? Number(fee.taxaFixa) : 0}
            required
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="observacao">Observação</Label>
        <Input id="observacao" name="observacao" defaultValue={fee?.observacao ?? ""} />
      </div>
    </>
  );
}

export function AddChannelFeeButton() {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="secondary">
          <PlusIcon />
          Nova faixa
        </Button>
      }
      title="Nova faixa de comissão"
      action={saveChannelFee}
    >
      <Fields />
    </FormDialog>
  );
}

export function EditChannelFeeButton({ fee }: { fee: ChannelFee }) {
  return (
    <FormDialog
      trigger={
        <Button type="button" variant="ghost" size="icon" className="size-7">
          <PencilIcon className="size-3.5" />
        </Button>
      }
      title={`Editar faixa — ${fee.canal}`}
      action={saveChannelFee}
    >
      <Fields fee={fee} />
    </FormDialog>
  );
}
