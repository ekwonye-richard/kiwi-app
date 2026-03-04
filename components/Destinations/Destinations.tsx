"use client";

import { useEffect, useRef, useState } from "react";
import Destination, { type DestinationItem } from "../Destination";
import styles from "./Destinations.module.css";

type DestinationsProps = {
  items: DestinationItem[];
  warningFlagAmount?: number;
};

const Destinations = ({ items, warningFlagAmount }: DestinationsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const shouldScrollAfterCollapseRef = useRef(false);

  useEffect(() => {
    if (!isExpanded && shouldScrollAfterCollapseRef.current) {
      const button = toggleButtonRef.current;
      if (button) {
        const targetTop = Math.max(
          0,
          window.scrollY + button.getBoundingClientRect().top - 300,
        );
        window.scrollTo({
          top: targetTop,
          // behavior: "smooth",
        });
      }
      shouldScrollAfterCollapseRef.current = false;
    }
  }, [isExpanded]);

  if (items.length === 0) {
    return null;
  }

  const canExpand = items.length > 10;
  const visibleItems = items.slice(0, isExpanded ? 25 : 5);

  return (
    <section className={styles.destinations}>
      <h4 className={styles.heading}>Peak destinations</h4>
      <ul className={styles.list}>
        {visibleItems.map((item, index) => (
          <Destination
            key={item.id}
            item={item}
            isLast={index === visibleItems.length - 1}
            warningFlagAmount={warningFlagAmount}
          />
        ))}
      </ul>
      {canExpand ? (
        <button
          ref={toggleButtonRef}
          type="button"
          className={styles.toggleButton}
          onClick={() => {
            if (isExpanded) {
              shouldScrollAfterCollapseRef.current = true;
            }
            setIsExpanded((previous) => !previous);
          }}
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </section>
  );
};

export default Destinations;
