import { z } from "zod";

// PATCH contract for the admin colly editor.
//
// Every field here mirrors a nullable `collys` column, and the editor always
// echoes the row's CURRENT values back (it sends a whole colly, not a delta).
// So the wire contract has to accept `null` wherever the column does —
// otherwise a legacy row with e.g. `broken IS NULL` makes the whole PATCH fail
// validation and the admin sees "Save failed (400)" with no way to fix it.
//
// `null` means "leave this column alone" (the UPDATE COALESCEs it away), NOT
// "write NULL". Clearing a value is done with an empty string, which the
// render fields translate to NULL themselves.
export const collyPatchSchema = z.object({
  id: z.number().int().positive(),
  filename: z.string().max(60).nullable().optional(),
  name: z.string().max(500).nullable().optional(),
  year: z.number().int().nullable().optional(),
  month: z.number().int().nullable().optional(),
  day: z.number().int().nullable().optional(),
  type: z.string().max(50).nullable().optional(),
  file_id: z.string().max(60).nullable().optional(),
  artistNames: z.array(z.string().trim().min(1).max(100)).optional(),
  crewNames: z.array(z.string().trim().min(1).max(200)).optional(),
  broken: z.number().int().nullable().optional(),
  broken_comment: z.string().max(1000).nullable().optional(),
  // Render settings (parity with the submit form). Always sent by the admin UI;
  // empty -> null clears the per-colly override (falls back to viewer/default).
  render_font: z.string().max(32).nullable().optional(),
  render_fg: z.string().max(15).nullable().optional(),
  render_bg: z.string().max(15).nullable().optional(),
  soundtrack: z.string().max(255).nullable().optional(),
  // Logo map (visual editor). When present, replaces the colly's catalog rows
  // with this manual map (drives rendering + search), like a mapped upload.
  logos: z.array(z.object({
    line: z.number().int().positive(),
    end: z.number().int().positive().optional(),
    caption: z.string().max(200),
  })).optional(),
});

export type CollyPatch = z.infer<typeof collyPatchSchema>;
