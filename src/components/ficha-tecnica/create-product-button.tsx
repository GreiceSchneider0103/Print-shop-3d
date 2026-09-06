import { PlusIcon } from "lucide-react";

import { createProduct } from "@/app/(app)/ficha-tecnica/actions";
import { FormDialog } from "@/components/configuracoes/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateProductButton() {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="secondary">
          <PlusIcon />
          Novo produto
        </Button>
      }
      title="Novo produto"
      description="Cadastre o SKU e o nome — filamentos, custo e tempo de produção você ajusta depois direto na linha."
      action={createProduct}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sku">SKU</Label>
        <Input id="sku" name="sku" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="produto">Produto</Label>
        <Input id="produto" name="produto" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tempoProducaoMin">Tempo de produção (min)</Label>
        <Input id="tempoProducaoMin" name="tempoProducaoMin" type="number" step="1" />
      </div>
    </FormDialog>
  );
}
