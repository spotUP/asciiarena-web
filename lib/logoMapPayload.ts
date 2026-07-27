import { z } from "zod";

// The logo map as it travels over the wire, shared by the admin colly PATCH
// and the public tagging route. Lines are 1-based as authored; the catalog
// builder converts to 0-based when it writes rows.
//
// `end` is optional: a map entry without one runs to the next entry's start.
// A caption is free text — buildLogoRow decides whether it is searchable.
export const logoMapEntrySchema = z.object({
  line: z.number().int().positive(),
  end: z.number().int().positive().optional(),
  caption: z.string().max(200),
}).refine((e) => e.end === undefined || e.end >= e.line, {
  message: "end must not be before line",
});

// 500 entries is far beyond any real colly (the biggest packs run to ~90) and
// bounds the work a single request can create.
export const logoMapSchema = z.array(logoMapEntrySchema).max(500);

export type LogoMapEntry = z.infer<typeof logoMapEntrySchema>;
