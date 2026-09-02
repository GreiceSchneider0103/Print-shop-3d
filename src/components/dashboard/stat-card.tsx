import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  hintTone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  hintTone?: "positive" | "negative" | "neutral";
}) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {hint && (
          <p
            className={cn(
              "mt-1 text-xs",
              hintTone === "positive" && "text-emerald-600",
              hintTone === "negative" && "text-destructive",
              hintTone === "neutral" && "text-muted-foreground",
            )}
          >
            {hint}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
