import { z } from "zod";

import { roleById } from "./catalog";
import type { CustomScript } from "./types";

export const maxScriptFileBytes = 256 * 1024;

const metadataSchema = z.object({
  name: z.string().trim().max(50).optional(),
  author: z.string().trim().max(50).optional(),
  bootlegger: z.array(z.string().trim().min(1).max(2000)).max(10).optional(),
  firstNight: z.array(z.string().max(50)).max(200).optional(),
  otherNight: z.array(z.string().max(50)).max(200).optional(),
});

export const customScriptSchema = metadataSchema
  .extend({
    name: z.string().trim().min(1).max(50),
    roleIds: z.array(z.string().max(50)).min(1).max(200),
  })
  .strict()
  .superRefine((script, ctx) => {
    const ids = new Set<string>();
    for (const id of script.roleIds) {
      if (!roleById.has(id))
        ctx.addIssue({
          code: "custom",
          message: `Unknown official character “${id}”.`,
        });
      if (ids.has(id))
        ctx.addIssue({
          code: "custom",
          message: `Character “${id}” appears twice.`,
        });
      ids.add(id);
    }
    for (const night of ["firstNight", "otherNight"] as const) {
      const system =
        night === "firstNight"
          ? ["dusk", "minioninfo", "demoninfo", "dawn"]
          : ["dusk", "dawn"];
      const order = script[night] ?? [];
      if (new Set(order).size !== order.length)
        ctx.addIssue({
          code: "custom",
          message: `Duplicate entry in ${night}.`,
        });
      for (const id of order) {
        if (!ids.has(id) && !system.includes(id))
          ctx.addIssue({
            code: "custom",
            message: `Unknown ${night} entry “${id}”.`,
          });
      }
    }
  });

const legacyReference = z
  .object({
    id: z.string(),
    ghost: z.boolean().optional(),
    pinned: z.boolean().optional(),
  })
  .strict();

export function parseScriptExport(value: unknown): CustomScript {
  if (!Array.isArray(value) || value.length < 5 || value.length > 201) {
    throw new Error("Choose a Script Tool JSON array with 5 to 201 entries.");
  }
  let metadata: z.infer<typeof metadataSchema> | undefined;
  const roleIds: string[] = [];
  const entries: unknown[] = value;
  for (const [index, entry] of entries.entries()) {
    if (typeof entry === "string") {
      roleIds.push(entry);
    } else if (
      entry &&
      typeof entry === "object" &&
      "id" in entry &&
      entry.id === "_meta"
    ) {
      if (metadata)
        throw new Error("The script has more than one metadata entry.");
      const result = metadataSchema.safeParse(entry);
      if (!result.success)
        throw new Error(
          "The script metadata is invalid: " +
            result.error.issues[0]!.path.join("."),
        );
      metadata = result.data;
    } else {
      const result = legacyReference.safeParse(entry);
      if (!result.success)
        throw new Error(
          `Entry ${index + 1} must reference an official character. Homebrew character definitions are unsupported.`,
        );
      roleIds.push(result.data.id);
    }
  }
  const result = customScriptSchema.safeParse({
    ...metadata,
    name: metadata?.name?.length ? metadata.name : "Untitled script",
    roleIds,
  });
  if (!result.success) throw new Error(result.error.issues[0]!.message);
  return result.data;
}
