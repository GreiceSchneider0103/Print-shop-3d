import { PencilIcon, PlusIcon } from "lucide-react";
import type { Deadline } from "@prisma/client";

import { saveDeadline } from "@/app/(app)/configuracoes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { FormDialog } from "./form-dialog";

function Fields({ deadline }: { deadline?: Deadline }) {
  return (
    <>
      {deadline && <input type="hidden" name="id" defaultValue={deadline.id} />}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="canal">Canal</Label>
        <Input id="canal" name="canal" defaultValue={deadline?.canal} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="diasUteisPrazo">Dias úteis de prazo</Label>
        <Input
          id="diasUteisPrazo"
          name="diasUteisPrazo"
          type="number"
          step="1"
          defaultValue={deadline?.diasUteisPrazo ?? 0}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="observacao">Observação</Label>
        <Input id="observacao" name="observacao" defaultValue={deadline?.observacao ?? ""} />
      </div>
    </>
  );
}

export function AddDeadlineButton() {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="secondary">
          <PlusIcon />
          Novo canal
        </Button>
      }
      title="Novo prazo por canal"
      action={saveDeadline}
    >
      <Fields />
    </FormDialog>
  );
}

export function EditDeadlineButton({ deadline }: { deadline: Deadline }) {
  return (
    <FormDialog
      trigger={
        <Button type="button" variant="ghost" size="icon" className="size-7">
          <PencilIcon className="size-3.5" />
        </Button>
      }
      title={`Editar prazo — ${deadline.canal}`}
      action={saveDeadline}
    >
      <Fields deadline={deadline} />
    </FormDialog>
  );
}
