export type Badge = {
  label: string;
  tone: "D" | "M" | "C";
};

export type TimelineStep = {
  label: string;
  title: string;
  detail: string;
  highlight?: boolean;
  badges?: Badge[];
  segments?: { badge?: Badge; text?: string }[];
};

export type Closure = {
  from: string;
  detail: string;
  type: string;
  example: true;
};

export type Venue = {
  slug: string;
  name: string;
  address: string;
  citySlug: string;
  neighborhood: string;
  capacity: number;
  hotelsWithin3km: number;
  accessLabel: string;
  accessValue: string;
  neighborhoods: {
    range: string;
    name: string;
    summary: string;
    pros: string;
    cons: string;
  }[];
  transit: TimelineStep[];
  returnAdvice: {
    label: string;
    title: string;
    text: string;
  };
  closures: Closure[];
  faq: { question: string; answer: string }[];
};

export type Hotel = {
  slug: string;
  venueSlug: string;
  name: string;
  detail: string;
  neighborhood: string;
  walkMinutes: number;
  driveMinutes: number;
  distanceKm: number;
  pricePerNight: number;
  example: true;
  mapX?: number;
  mapY?: number;
};

export type City = {
  slug: string;
  name: string;
};

export type ShowEvent = {
  slug: string;
  artist: string;
  venueSlug: string | null;
  citySlug: string;
  date: string;
  dateExact: boolean;
  doors: string | null;
  showTime: string | null;
  duration?: string;
  type: string;
  plan?: TimelineStep[];
  closures?: Closure[];
};
