import { Coins } from "lucide-react";

import { cn } from "@/lib/utils";

export function ReminderIcon({ className }: { className?: string }) {
  return (
    <Coins aria-hidden="true" className={cn("reminder-icon", className)} />
  );
}
