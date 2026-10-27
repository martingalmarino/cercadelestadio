const BA = "America/Argentina/Buenos_Aires";

export function baDate(nowMs: number) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(nowMs));
}

export function weekdayName(isoDate: string) {
  const name = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    timeZone: BA,
  }).format(new Date(`${isoDate}T12:00:00-03:00`));
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function monthName(isoDate: string) {
  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    timeZone: BA,
  }).format(new Date(`${isoDate}T12:00:00-03:00`));
}

export function formatFullDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

export function formatDayMonth(isoDate: string) {
  const [, month, day] = isoDate.split("-");
  return `${day}/${month}`;
}

export function eventDateLabel(date: string, dateExact: boolean) {
  if (!dateExact) {
    const [year, month] = date.split("-");
    return `${month}/${year}`;
  }
  return formatFullDate(date);
}

export function formatArs(amount: number) {
  return `ARS ${new Intl.NumberFormat("es-AR").format(amount)}`;
}

export function formatKm(km: number) {
  return `${km.toFixed(1).replace(".", ",")} km`;
}

export function formatCount(value: number) {
  return new Intl.NumberFormat("es-AR").format(value);
}

export function countdownTarget(event: {
  date: string;
  dateExact: boolean;
  showTime: string | null;
}) {
  if (!event.dateExact) {
    return `${event.date.slice(0, 8)}01T00:00:00-03:00`;
  }
  const time = event.showTime ?? "21:00";
  return `${event.date}T${time}:00-03:00`;
}

export function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function withArticle(name: string) {
  if (name.startsWith("Movistar")) return name;
  return `el ${name}`;
}
