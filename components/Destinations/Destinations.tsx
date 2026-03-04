import Destination, { type DestinationItem } from "../Destination";
import styles from "./Destinations.module.css";

type DestinationsProps = {
  items: DestinationItem[];
  warningFlagAmount?: number;
};

const Destinations = ({ items, warningFlagAmount }: DestinationsProps) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className={styles.group}>
      <h4 className={styles.heading}>Peak destinations</h4>
      <ul className={styles.list}>
        {items.map((item, index) => (
          <Destination
            key={item.id}
            item={item}
            isLast={index === items.length - 1}
            warningFlagAmount={warningFlagAmount}
          />
        ))}
      </ul>
    </section>
  );
};

export default Destinations;
