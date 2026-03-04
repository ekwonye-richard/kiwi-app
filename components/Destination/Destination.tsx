import classNames from "classnames";
import styles from "./Destination.module.css";

export type DestinationItem = {
  id: string;
  description: string;
  total: number;
  currency: string;
};

type DestinationProps = {
  item: DestinationItem;
  isLast?: boolean;
  warningFlagAmount?: number;
};

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

const Destination = ({
  item,
  isLast,
  warningFlagAmount,
}: DestinationProps) => {
  const isCredit = item.total > 0;
  const amountClassName =
    warningFlagAmount !== undefined && item.total <= warningFlagAmount
      ? styles.warning
      : isCredit
        ? styles.credit
        : styles.debit;

  return (
    <li className={classNames(styles.row, { [styles.lastRow]: isLast })}>
      <div className={styles.description}>{item.description || "Destination"}</div>
      <div className={amountClassName}>
        {formatAmount(item.total, item.currency)}
      </div>
    </li>
  );
};

export default Destination;
