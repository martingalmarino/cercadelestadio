"use client";

import { pad2 } from "@/lib/format";
import { useEffect, useState } from "react";

type CountdownProps = {
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

export function Countdown({
  target,
  finished,
  approximate,
  dateLabel,
}: CountdownProps) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  if (finished) {
    return (
      <>
        <div>
          <small>Estado</small>
          <b>Finalizado</b>
        </div>
        <div>
          <small>Fecha</small>
          <b>{dateLabel}</b>
        </div>
        <div>
          <small>Show</small>
          <b className="ok">Pasó</b>
        </div>
      </>
    );
  }

  const remaining = now === null ? undefined : parts(target, now);

  if (approximate && remaining === null && now !== null) {
    return (
      <>
        <div aria-live="polite">
          <small>Estado</small>
          <b>Este mes</b>
        </div>
        <div>
          <small>Fecha</small>
          <b>{dateLabel}</b>
        </div>
        <div>
          <small>Día</small>
          <b>A confirmar</b>
        </div>
      </>
    );
  }

  const days = remaining?.days;
  const dayLabel =
    days === undefined ? "—" : days === 1 ? "1 día" : `${days} días`;

  return (
    <>
      <div aria-live="polite">
        <small>Faltan</small>
        <b>{dayLabel}</b>
      </div>
      <div>
        <small>Horas</small>
        <b>{remaining ? pad2(remaining.hours) : "—"}</b>
      </div>
      <div>
        <small>Minutos</small>
        <b>{remaining ? pad2(remaining.minutes) : "—"}</b>
      </div>
    </>
  );
}
