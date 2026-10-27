"use client";

import { pad2 } from "@/lib/format";
import { useEffect, useState } from "react";
import styles from "./countdown.module.css";

type CountdownProps = {
  initialNow: number;
  target: string;
  finished: boolean;
  approximate: boolean;
  dateLabel: string;
};

function parts(target: string, now: number) {
  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return null;
  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes - days * 24 * 60) / 60);
  const minutes = totalMinutes % 60;
  return { days, hours, minutes };
}

function Cell({
  label,
  value,
  live = false,
  done = false,
}: {
  label: string;
  value: string;
  live?: boolean;
  done?: boolean;
}) {
  return (
    <div>
      <span className={styles.label}>{label}</span>
      <b className={done ? `${styles.value} ${styles.done}` : styles.value} aria-live={live ? "polite" : undefined}>
        {value}
      </b>
    </div>
  );
}

export function Countdown({
  initialNow,
  target,
  finished,
  approximate,
  dateLabel,
}: CountdownProps) {
  const [now, setNow] = useState(initialNow);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const start = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 30000);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(id);
    };
  }, []);

  if (finished) {
    return (
      <div className={styles.block}>
        <div className={styles.cells}>
          <Cell label="Estado" value="Finalizado" />
          <Cell label="Fecha" value={dateLabel} />
          <Cell label="Show" value="Pasó" done />
        </div>
      </div>
    );
  }

  const remaining = parts(target, now);

  if (approximate && remaining === null) {
    return (
      <div className={styles.block}>
        <div className={styles.cells}>
          <Cell label="Estado" value="Este mes" live />
          <Cell label="Fecha" value={dateLabel} />
          <Cell label="Día" value="A confirmar" />
        </div>
      </div>
    );
  }

  const days = remaining?.days ?? 0;
  const dayLabel = days === 1 ? "1 día" : `${days} días`;
  const hours = remaining ? pad2(remaining.hours) : "00";
  const minutes = remaining ? pad2(remaining.minutes) : "00";

  return (
    <div className={styles.block} data-live="">
      <p className={styles.line}>
        {days} d · {hours} h · {minutes} m
      </p>
      <div className={styles.cells}>
        <Cell label="Faltan" value={dayLabel} live />
        <Cell label="Horas" value={hours} />
        <Cell label="Minutos" value={minutes} />
      </div>
    </div>
  );
}
