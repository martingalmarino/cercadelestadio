import { z } from "zod";
import type { EventCategory, ShowEvent, Venue } from "@/lib/types";

const eventStatuses = [
  "announced",
  "confirmed",
  "rescheduled",
  "cancelled",
  "past",
] as const;

const eventCategories = ["recital", "partido", "festival"] as const;

const badgeSchema = z.object({
  label: z.string(),
  tone: z.enum(["D", "M", "C"]),
});

const timelineStepSchema = z.object({
  label: z.string(),
  title: z.string(),
  detail: z.string(),
  highlight: z.boolean().optional(),
  badges: z.array(badgeSchema).optional(),
  segments: z
    .array(
      z.object({
        badge: badgeSchema.optional(),
        text: z.string().optional(),
      }),
    )
    .optional(),
});

const closureSchema = z.object({
  from: z.string(),
  detail: z.string(),
  type: z.string(),
  example: z.literal(true),
});

const sourceSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1),
  firstSeen: z.string().min(1),
  lastSeen: z.string().min(1),
});

const categoryByType: Record<string, EventCategory> = {
  recital: "recital",
  partido: "partido",
  festival: "festival",
};

function categoryFromType(type: string): EventCategory | null {
  return categoryByType[type.trim().toLowerCase()] ?? null;
}

export const showEventSchema = z.object({
  slug: z.string().min(1),
  artist: z.string().min(1),
  venueSlug: z.string().min(1).nullable(),
  citySlug: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateExact: z.boolean(),
  doors: z.string().nullable(),
  showTime: z.string().nullable(),
  duration: z.string().optional(),
  type: z.string().min(1),
  category: z.enum(eventCategories).optional(),
  performerType: z.enum(["person", "group"]).optional(),
  status: z.enum(eventStatuses).default("confirmed"),
  sources: z.array(sourceSchema).optional(),
  externalIds: z.record(z.string(), z.string()).optional(),
  ticketUrl: z.string().optional(),
  plan: z.array(timelineStepSchema).optional(),
  closures: z.array(closureSchema).optional(),
  updatedAt: z.string().optional(),
});

const neighborhoodSchema = z.object({
  range: z.string(),
  name: z.string(),
  summary: z.string(),
  pros: z.string(),
  cons: z.string(),
});

export const venueSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  seoName: z.string().min(1),
  nickname: z.string().nullable(),
  address: z.string(),
  street: z.string(),
  locality: z.string(),
  region: z.string(),
  lat: z.number(),
  lng: z.number(),
  osm: z
    .object({
      type: z.enum(["way", "relation"]),
      id: z.number(),
    })
    .optional(),
  citySlug: z.string().min(1),
  neighborhood: z.string(),
  capacity: z.number(),
  hotelsWithin3km: z.number(),
  accessLabel: z.string(),
  accessValue: z.string(),
  neighborhoods: z.array(neighborhoodSchema),
  transit: z.array(timelineStepSchema),
  returnAdvice: z.object({
    label: z.string(),
    title: z.string(),
    text: z.string(),
  }),
  closures: z.array(closureSchema),
  faq: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    }),
  ),
  draft: z.boolean().optional(),
  updatedAt: z.string().optional(),
});

function formatIssues(error: z.ZodError) {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "raíz";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
}

function slugOf(item: unknown, index: number) {
  if (
    item &&
    typeof item === "object" &&
    "slug" in item &&
    typeof item.slug === "string" &&
    item.slug.length > 0
  ) {
    return item.slug;
  }
  return `índice ${index}`;
}

function assertList(data: unknown, label: string) {
  if (!Array.isArray(data)) {
    throw new Error(`${label}: el archivo tiene que ser una lista.`);
  }
  return data;
}

export function parseEvents(data: unknown): ShowEvent[] {
  return assertList(data, "Eventos").map((item, index) => {
    const slug = slugOf(item, index);
    const parsed = showEventSchema.safeParse(item);
    if (!parsed.success) {
      throw new Error(`Evento inválido (${slug}): ${formatIssues(parsed.error)}`);
    }
    const category = parsed.data.category ?? categoryFromType(parsed.data.type);
    if (!category) {
      throw new Error(
        `Evento inválido (${slug}): category: no se puede mapear desde type "${parsed.data.type}".`,
      );
    }
    return { ...parsed.data, category };
  });
}

export function parseVenues(data: unknown): Venue[] {
  return assertList(data, "Estadios").map((item, index) => {
    const slug = slugOf(item, index);
    const parsed = venueSchema.safeParse(item);
    if (!parsed.success) {
      throw new Error(`Estadio inválido (${slug}): ${formatIssues(parsed.error)}`);
    }
    return parsed.data;
  });
}
