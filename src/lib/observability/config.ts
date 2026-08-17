import { env } from "@/env";

export const observabilityEnabled =
  process.env.NODE_ENV === "production" &&
  env.NEXT_PUBLIC_DISABLE_OBSERVABILITY !== "true";
