import styles from "./faq-list.module.css";

type FaqItem = {
  question: string;
  answer: string;
};

export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div>
      {items.map((item, index) => (
        <details key={item.question} className={styles.item} open={index === 0}>
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
