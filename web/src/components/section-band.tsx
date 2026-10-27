import styles from "./section-band.module.css";

type SectionBandProps = {
  index: string;
  title: string;
  titleId: string;
  meta?: string;
};

export function SectionBand({ index, title, titleId, meta }: SectionBandProps) {
  return (
    <div className={styles.band}>
      <div className={styles.inner}>
        <span className={styles.index}>{index}</span>
        <h2 id={titleId}>{title}</h2>
        {meta ? <span className={styles.meta}>{meta}</span> : null}
      </div>
    </div>
  );
}
