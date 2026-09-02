import { PencilIcon, PlusIcon } from "lucide-react";
import type { FixedCost } from "@prisma/client";

import { saveFixedCost } from "@/app/(app)/configuracoes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { FormDialog } from "./form-dialog";

function toMonthInputValue(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function Fields({ cost }: { cost?: FixedCost }) {
  return (
    <>
      {cost && <input type="hidden" name="id" defaultValue={cost.id} />}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mes">Mês</Label>
        <Input
          id="mes"
          name="mes"
          type="month"
          defaultValue={cost ? toMonthInputValue(cost.mes) : toMonthInputValue(new Date())}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ads">Ads / impulsionamento</Label>
          <Input id="ads" name="ads" type="number" step="0.01" defaultValue={cost ? Number(cost.ads) : 0} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tiny">Tiny</Label>
          <Input id="tiny" name="tiny" type="number" step="0.01" defaultValue={cost ? Number(cost.tiny) : 0} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mei">MEI</Label>
          <Input id="mei" name="mei" type="number" step="0.01" defaultValue={cost ? Number(cost.mei) : 0} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="parcela">Parcela</Label>
          <Input
            id="parcela"
            name="parcela"
            type="number"
            step="0.01"
            defaultValue={cost ? Number(cost.parcela) : 0}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="outros">Outros custos</Label>
          <Input
            id="outros"
            name="outros"
            type="number"
            step="0.01"
            defaultValue={cost ? Number(cost.outros) : 0}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reembolso">Reembolso</Label>
          <Input
            id="reembolso"
            name="reembolso"
            type="number"
            step="0.01"
            defaultValue={cost ? Number(cost.reembolso) : 0}
          />
        </div>
      </div>
      <p className="text-muted-foreground text-xs">
        O total é calculado automaticamente (Ads + Tiny + MEI + Outros + Parcela).
      </p>
    </>
  );
}

export function AddFixedCostButton() {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="secondary">
          <PlusIcon />
          Novo mês
        </Button>
      }
      title="Novo custo fixo mensal"
      action={saveFixedCost}
    >
      <Fields />
    </FormDialog>
  );
}

export function EditFixedCostButton({ cost }: { cost: FixedCost }) {
  return (
    <FormDialog
      trigger={
        <Button type="button" variant="ghost" size="icon" className="size-7">
          <PencilIcon className="size-3.5" />
        </Button>
      }
      title={`Editar custos — ${toMonthInputValue(cost.mes)}`}
      action={saveFixedCost}
    >
      <Fields cost={cost} />
    </FormDialog>
  );
}
