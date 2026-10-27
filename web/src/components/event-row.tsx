import { ArrowLabel } from "@/components/ui/text-link";
import { Tag } from "@/components/ui/tag";
import { eventDateLabel } from "@/lib/format";
import Link from "next/link";
import styles from "./row-list.module.css";

const MONTHS = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

type EventRowProps = {
  href: string;
  date: string;
  approximate?: boolean;
  title: string;
  subtitle: string;
  place?: string;
  extra?: string;
  actionLabel?: string;
};

export function EventRow({
  href,
  date,
  approximate = false,
  title,
  subtitle,
  place,
  extra,
  actionLabel = "Hoteles cerca",
}: EventRowProps) {
  const [year, month, day] = date.split("-");
  const spoken = eventDateLabel(date, !approximate);
  const main = approximate
    ? `${MONTHS[Number(month) - 1]} ${year}`
    : `${day}/${month}`;

  return (
    <Link
      className={styles.row}
      href={href}
      role="listitem"
      aria-label={`${title}, ${spoken}`}
    >
      <span className={styles.date}>
        {main}
        {approximate ? (
          <span className={styles.confirm}>
            <Tag tone="ok">a confirmar</Tag>
          </span>
        ) : (
          <small>{year}</small>
        )}
      </span>
      <span>
        <span className={styles.title}>{title}</span>
        <br />
        <span className={styles.sub}>{subtitle}</span>
      </span>
      <span className={`${styles.place} ${styles.sub}`}>{place}</span>
      <span className={`${styles.extra} ${styles.sub}`}>{extra}</span>
      <span className={styles.action}>
        <ArrowLabel>{actionLabel}</ArrowLabel>
      </span>
    </Link>
  );
}
