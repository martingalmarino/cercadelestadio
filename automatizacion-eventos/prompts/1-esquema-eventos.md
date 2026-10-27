En `web/src/lib/types.ts` extendé `ShowEvent` sin romper lo existente:
- `status: "announced" | "confirmed" | "rescheduled" | "cancelled" | "past"` (default "confirmed" para los actuales de `web/content/events.json`).
- `category: "recital" | "partido" | "festival"` (mapear desde `type`).
- `sources?: { name: string; url: string; firstSeen: string; lastSeen: string }[]`.
- `externalIds?: Record<string, string>`.
Agregá `zod` y creá `web/src/lib/schema.ts` con el schema de eventos y venues; usalo en `web/src/lib/content.ts` para validar al cargar (error claro con el slug). Actualizá `events.json` con los campos nuevos. En `web/src/lib/events.ts` agregá helpers `isPast`, `visibleEvents` (excluye cancelled y past de listados). En `src/app/evento/[slug]/page.tsx` mostrá un aviso sobrio si el evento está cancelled, rescheduled o past (sin emojis, respetá el diseño de `globals.css`). No cambies nada más.
