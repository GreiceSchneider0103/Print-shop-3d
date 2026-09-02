import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <Icon className="text-muted-foreground/50 size-8" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}
