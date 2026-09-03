import { PencilIcon } from "lucide-react";

import { saveRevenueGoal } from "@/app/(app)/configuracoes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { FormDialog } from "./form-dialog";

export function EditRevenueGoalButton({ metaMensal }: { metaMensal: number }) {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="secondary">
          <PencilIcon />
          Editar meta
        </Button>
      }
      title="Meta de faturamento mensal"
      description="Usada como referência no gráfico do Dashboard Mensal."
      action={saveRevenueGoal}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="metaMensal">Meta mensal (R$)</Label>
        <Input id="metaMensal" name="metaMensal" type="number" step="0.01" defaultValue={metaMensal} required />
      </div>
    </FormDialog>
  );
}
