import { Eye } from "lucide-react";

import { cn } from "@/lib/utils";

export function RevealIcon({ className }: { className?: string }) {
  return <Eye aria-hidden="true" className={cn("reveal-icon", className)} />;
}
