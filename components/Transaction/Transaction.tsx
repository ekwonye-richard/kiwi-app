import type {
  TrueLayerAccountAccountNumber,
  TrueLayerProvider,
} from "@/services";
import AccountLogo from "../AccountLogo";
import styles from "./Transaction.module.css";
import classNames from "classnames";

export type TransactionItem = {
  id: string;
  timestamp: string;
  description: string;
  amount: number;
  currency: string;
  accountNumber: TrueLayerAccountAccountNumber;
  provider?: TrueLayerProvider;
};

type TransactionProps = {
  item: TransactionItem;
  isLastGroup?: boolean;
};

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const Transaction = ({ item, isLastGroup }: TransactionProps) => {
  const isCredit = item.amount > 0;
  const accountNumberLabel =
    item.accountNumber.number ||
    item.accountNumber.swift_bic ||
    item.accountNumber.iban ||
    "****";

  return (
    <li
      className={classNames(styles.row, { [styles.lastGroupRow]: isLastGroup })}
    >
      <div className={styles.meta}>
        <div className={styles.description}>
          {item.description || "Transaction"}
        </div>
        <div className={styles.subline}>
          <span className={styles.accountBadge}>
            <AccountLogo provider={item.provider} size="small" />
            <span>{accountNumberLabel}</span>
          </span>
          <span>·</span>
          <span>{formatTime(item.timestamp)}</span>
        </div>
      </div>
      <div className={isCredit ? styles.credit : styles.debit}>
        {formatAmount(item.amount, item.currency)}
      </div>
    </li>
  );
};

export default Transaction;
