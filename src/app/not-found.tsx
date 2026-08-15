import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFoundPage() {
  return (
    <main className="entry-cover not-found-page">
      <div className="entry-leather" aria-hidden="true" />
      <div className="entry-inlay" aria-hidden="true" />

      <section className="not-found-content" aria-labelledby="not-found-title">
        <div className="not-found-code" aria-hidden="true">
          404
        </div>
        <h1 id="not-found-title">Game Not Found</h1>
        <p>This game doesn’t exist or may have ended.</p>
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "quiet", size: "md" }),
            "not-found-action",
          )}
        >
          <ArrowLeft aria-hidden="true" />
          Back Home
        </Link>
      </section>
    </main>
  );
}
