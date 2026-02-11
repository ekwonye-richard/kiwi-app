/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { type TrueLayerProvider } from "@/services";
import { BarclaysLogo, WiseLogo } from "@/vectors";
import classNames from "classnames";
import styles from "./AccountLogo.module.css";

function getProviderKey(provider?: TrueLayerProvider | null | string) {
  if (!provider) {
    return "";
  }

  if (typeof provider === "string") {
    return provider.toLowerCase();
  }

  return `${provider.provider_id} ${provider.display_name}`.toLowerCase();
}

export function resolveProviderLogoAsset(
  provider?: TrueLayerProvider | null | string,
) {
  const providerKey = getProviderKey(provider);

  if (providerKey.includes("barclays")) {
    return <BarclaysLogo />;
  }

  if (providerKey.includes("wise") || providerKey.includes("transferwise")) {
    return <WiseLogo />;
  }

  return null;
}

type AccountLogoProps = {
  provider?: TrueLayerProvider | null;
  className?: string;
  size?: "small" | "medium" | "large";
};

const AccountLogo = ({
  provider,
  className,
  size = "medium",
}: AccountLogoProps) => {
  const [hasLogoError, setHasLogoError] = useState(false);
  const providerName = provider?.display_name ?? "Provider";
  const providerLogoAsset = resolveProviderLogoAsset(provider);
  const logoSrc = provider?.logo_uri?.trim();
  const showImage = Boolean(!providerLogoAsset && logoSrc && !hasLogoError);
  const fallbackCharacter = providerName[0]?.toUpperCase() ?? "?";

  return (
    <span
      className={classNames(styles.logoRoot, className, styles[size])}
      title={providerName}
      aria-label={providerName}
    >
      {providerLogoAsset && (
        <span className={styles.logoAsset} aria-hidden="true">
          {providerLogoAsset}
        </span>
      )}

      {showImage && (
        <span className={styles.logo} aria-hidden="true">
          <img
            src={logoSrc}
            alt={`${providerName} logo`}
            onError={() => setHasLogoError(true)}
          />
        </span>
      )}

      {!providerLogoAsset && !showImage && (
        <span className={styles.logoFallback} aria-hidden="true">
          {fallbackCharacter}
        </span>
      )}
    </span>
  );
};

export default AccountLogo;
