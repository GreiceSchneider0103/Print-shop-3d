import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const nativeSelectClass =
  "border-input flex h-9 w-40 rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2 outline-none";

export function OrdersFilter({
  filters,
  canais,
  situacoes,
}: {
  filters: { canal?: string; situacao?: string; sku?: string; uf?: string; from?: string; to?: string };
  canais: string[];
  situacoes: string[];
}) {
  return (
    <form className="flex flex-wrap items-end gap-3" action="" method="get">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="canal">Canal</Label>
        <select id="canal" name="canal" defaultValue={filters.canal ?? ""} className={nativeSelectClass}>
          <option value="">Todos</option>
          {canais.map((canal) => (
            <option key={canal} value={canal}>
              {canal}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="situacao">Situação</Label>
        <select id="situacao" name="situacao" defaultValue={filters.situacao ?? ""} className={nativeSelectClass}>
          <option value="">Todas</option>
          {situacoes.map((situacao) => (
            <option key={situacao} value={situacao}>
              {situacao}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sku">SKU</Label>
        <Input id="sku" name="sku" defaultValue={filters.sku ?? ""} className="w-32" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="uf">UF</Label>
        <Input id="uf" name="uf" defaultValue={filters.uf ?? ""} className="w-16" maxLength={2} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="from">De</Label>
        <Input id="from" name="from" type="date" defaultValue={filters.from ?? ""} className="w-40" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="to">Até</Label>
        <Input id="to" name="to" type="date" defaultValue={filters.to ?? ""} className="w-40" />
      </div>
      <Button type="submit" variant="secondary">
        Filtrar
      </Button>
    </form>
  );
}
