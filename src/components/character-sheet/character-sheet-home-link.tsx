"use client";

import { House } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function CharacterSheetHomeLink() {
  const link = (
    <Link
      href="/"
      aria-label="Home"
      className={cn(
        buttonVariants({ variant: "quiet", size: "sm" }),
        "size-8 px-0 text-black/55 hover:text-black/85",
      )}
    >
      <House className="size-4" />
    </Link>
  );

  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="bottom">Home</TooltipContent>
    </Tooltip>
  );
}
