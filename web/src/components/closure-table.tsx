import type { Closure } from "@/lib/types";
import styles from "./closure-table.module.css";

export function ClosureTable({
  rows,
  timeLabel = "Desde",
}: {
  rows: Closure[];
  timeLabel?: string;
}) {
  return (
    <div className={styles.scroll} tabIndex={0} role="region" aria-label="Cortes de calle">
      <table>
        <thead>
          <tr>
            <th scope="col">{timeLabel}</th>
            <th scope="col">Corte</th>
            <th scope="col">Tipo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.from}-${row.detail}`}>
              <td className={styles.when}>{row.from}</td>
              <td>{row.detail}</td>
              <td>{row.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
