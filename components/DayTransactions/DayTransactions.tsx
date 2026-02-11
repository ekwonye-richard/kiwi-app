import Transaction, { type TransactionItem } from "../Transaction";
import styles from "./DayTransactions.module.css";

type DayTransactionsProps = {
  label: string;
  items: TransactionItem[];
  isLastGroup?: boolean;
};

const DayTransactions = ({
  label,
  items,
  isLastGroup,
}: DayTransactionsProps) => {
  return (
    <section className={styles.group}>
      <h4 className={styles.heading}>{label}</h4>
      <ul className={styles.list}>
        {items.map((item) => (
          <Transaction key={item.id} item={item} isLastGroup={isLastGroup} />
        ))}
      </ul>
    </section>
  );
};

export default DayTransactions;
