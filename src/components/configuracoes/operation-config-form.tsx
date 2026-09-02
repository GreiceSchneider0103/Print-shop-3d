import { PencilIcon } from "lucide-react";
import type { OperationConfig } from "@prisma/client";

import { saveOperationConfig } from "@/app/(app)/configuracoes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { FormDialog } from "./form-dialog";

export function EditOperationConfigButton({ config }: { config: OperationConfig | null }) {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="secondary">
          <PencilIcon />
          Editar parâmetros
        </Button>
      }
      title="Parâmetros de operação"
      description="Salvar cria uma nova versão vigente — o histórico anterior é mantido."
      action={saveOperationConfig}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="potenciaImpressora">Potência da impressora (W)</Label>
        <Input
          id="potenciaImpressora"
          name="potenciaImpressora"
          type="number"
          step="1"
          defaultValue={config ? Number(config.potenciaImpressora) : 0}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tarifaEnergia">Tarifa de energia (R$/kWh)</Label>
        <Input
          id="tarifaEnergia"
          name="tarifaEnergia"
          type="number"
          step="0.0001"
          defaultValue={config ? Number(config.tarifaEnergia) : 0}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="maoObraHora">Mão de obra por hora (R$)</Label>
        <Input
          id="maoObraHora"
          name="maoObraHora"
          type="number"
          step="0.01"
          defaultValue={config ? Number(config.maoObraHora) : 0}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="depreciacaoManutencao">Depreciação/manutenção por hora (R$)</Label>
        <Input
          id="depreciacaoManutencao"
          name="depreciacaoManutencao"
          type="number"
          step="0.01"
          defaultValue={config ? Number(config.depreciacaoManutencao) : 0}
          required
        />
      </div>
      <p className="text-muted-foreground text-xs">
        Custo de energia/hora é calculado automaticamente: (Potência ÷ 1000) × Tarifa.
      </p>
    </FormDialog>
  );
}
