import type { Metadata } from "next";

import { EntryExperience } from "@/components/entry/entry-experience";
import { createPageMetadata } from "@/lib/site-config";

export const metadata: Metadata = createPageMetadata({
  title: "Online Grimoire",
  path: "/",
});

export default function HomePage() {
  return <EntryExperience />;
}
