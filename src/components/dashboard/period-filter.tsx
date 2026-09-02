import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PeriodFilter({ from, to }: { from: string; to: string }) {
  return (
    <form className="flex flex-wrap items-end gap-3" action="" method="get">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="from">De</Label>
        <Input id="from" name="from" type="date" defaultValue={from} className="w-40" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="to">Até</Label>
        <Input id="to" name="to" type="date" defaultValue={to} className="w-40" />
      </div>
      <Button type="submit" variant="secondary">
        Filtrar
      </Button>
    </form>
  );
}
