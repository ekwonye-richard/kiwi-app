/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import {
  type TrueLayerAccountAccountNumber,
  type TrueLayerProvider,
} from "@/services";
import styles from "./AccountCheckboxCard.module.css";
import classNames from "classnames";
import { resolveProviderLogoAsset } from "../AccountLogoList";

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
  const [hasLogoError, setHasLogoError] = useState(false);
  const providerName = provider?.display_name ?? "Provider";
  const logoSrc = provider?.logo_uri?.trim();
  const providerLogoAsset = resolveProviderLogoAsset(provider);
  const shouldShowAssetLogo = Boolean(providerLogoAsset);
  const shouldShowImageLogo = Boolean(
    !shouldShowAssetLogo && logoSrc && !hasLogoError,
  );
  const shouldShowCharacterFallback =
    !shouldShowAssetLogo && !shouldShowImageLogo;

  return (
    <label className={classNames(styles.card, { [styles.checked]: checked })}>
      {shouldShowAssetLogo && (
        <span className={styles.logoAsset} aria-hidden="true">
          {providerLogoAsset}
        </span>
      )}

      {shouldShowImageLogo && (
        <span className={styles.logo} aria-hidden="true">
          <img
            src={logoSrc}
            alt={`${providerName} logo`}
            onError={() => setHasLogoError(true)}
          />
        </span>
      )}

      {shouldShowCharacterFallback && (
        <span className={styles.logoFallback} aria-hidden="true">
          {providerName[0]?.toUpperCase() ?? "?"}
        </span>
      )}
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
