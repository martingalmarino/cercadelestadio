"use client";

import { useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

export function FaqList({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="faq">
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <div className={isOpen ? "o" : undefined} key={item.question}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? -1 : index)}
            >
              <span>{item.question}</span>
              <span>{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen ? <p>{item.answer}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
