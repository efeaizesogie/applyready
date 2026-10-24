import { z } from "zod";

export const Importance = z.enum(["critical", "important", "nice"]);
export type Importance = z.infer<typeof Importance>;

export const ApplicationType = z.enum(["scholarship", "job", "admission", "grant", "other"]);
export type ApplicationType = z.infer<typeof ApplicationType>;

// Models sometimes send null where we expect a string, or a number as a string.
// Normalise those at the edges so one sloppy field doesn't fail the whole scan.
const optionalText = z
  .string()
  .nullish()
  .transform((v) => (v && v.trim() ? v.trim() : null));

export const KeyDetail = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  importance: Importance,
});

export const Guidance = z.object({
  piece: z.string().min(1),
  wordLimit: optionalText,
  points: z.array(z.string().min(1)).min(1),
});

export const ExtractedItem = z.object({
  title: z.string().min(1),
  detail: optionalText,
  importance: Importance,
  effortDays: z.coerce.number().int().min(0).max(60),
});

export const ExtractionSchema = z.object({
  isApplication: z.boolean(),
  notApplicationReason: optionalText,
  title: z.string().default(""),
  organization: optionalText,
  type: ApplicationType.catch("other"),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullish()
    .catch(null)
    .transform((v) => v ?? null),
  deadlineText: optionalText,
  keyDetails: z.array(KeyDetail).default([]),
  guidance: z.array(Guidance).default([]),
  checklist: z.array(ExtractedItem).default([]),
});

export type Extraction = z.infer<typeof ExtractionSchema>;
export type KeyDetail = z.infer<typeof KeyDetail>;
export type Guidance = z.infer<typeof Guidance>;
export type ExtractedItem = z.infer<typeof ExtractedItem>;
