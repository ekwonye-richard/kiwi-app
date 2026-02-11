import {
  type TrueLayerAccountAccountNumber,
  type TrueLayerProvider,
} from "@/services";
import styles from "./AccountCheckboxCard.module.css";
import classNames from "classnames";
import AccountLogo from "../AccountLogo";

type AccountCheckboxCardProps = {
  accountType: string;
  accountNumber: TrueLayerAccountAccountNumber;
  currency: string;
  displayName: string;
  provider?: TrueLayerProvider;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

const AccountCheckboxCard = ({
  accountType,
  accountNumber,
  currency,
  displayName,
  provider,
  checked,
  onCheckedChange,
}: AccountCheckboxCardProps) => {
  return (
    <label className={classNames(styles.card, { [styles.checked]: checked })}>
      <AccountLogo provider={provider} />
      <div className={styles.accountInfo}>
        <h4 className={styles.accountName}>{displayName}</h4>
        <div className={styles.accountDetails}>
          {accountType} |{" "}
          {accountNumber.number ||
            accountNumber.swift_bic ||
            accountNumber.iban ||
            "****"}
        </div>
        <div className={styles.accountCurrency}>{currency}</div>
      </div>
      <input
        className={styles.checkbox}
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
      />
    </label>
  );
};

export default AccountCheckboxCard;
