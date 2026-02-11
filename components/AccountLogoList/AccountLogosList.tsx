/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { type TrueLayerProvider } from "@/services";
import { BarclaysLogo, WiseLogo } from "@/vectors";
import styles from "./AccountLogosList.module.css";

function getProviderKey(provider?: TrueLayerProvider | string) {
  if (!provider) {
    return "";
  }

  if (typeof provider === "string") {
    return provider.toLowerCase();
  }

  return `${provider.provider_id} ${provider.display_name}`.toLowerCase();
}

export function resolveProviderLogoAsset(
  provider?: TrueLayerProvider | string,
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

type AccountLogosListProps = {
  providers: Array<TrueLayerProvider | null | undefined>;
};

const AccountLogosList = ({ providers }: AccountLogosListProps) => {
  const [failedLogoProviderIds, setFailedLogoProviderIds] = useState<
    Set<string>
  >(new Set());

  const uniqueProviders = Array.from(
    new Map(
      providers
        .filter((provider): provider is TrueLayerProvider => Boolean(provider))
        .map((provider) => [provider.provider_id, provider]),
    ).values(),
  );

  if (uniqueProviders.length === 0) {
    return null;
  }

  const maxVisible = 6;
  const visibleProviders = uniqueProviders.slice(0, maxVisible);

  return (
    <div className={styles.accountLogosList}>
      {visibleProviders.map((provider) => {
        const providerKey = provider.provider_id || provider.display_name;
        const providerLogoAsset = resolveProviderLogoAsset(provider);
        const logoSrc = provider.logo_uri?.trim();
        const hasLogoError = failedLogoProviderIds.has(provider.provider_id);
        const showImage = Boolean(
          !providerLogoAsset && logoSrc && !hasLogoError,
        );
        const fallbackCharacter =
          provider.display_name?.[0]?.toUpperCase() ?? "?";

        return (
          <span
            key={providerKey}
            className={styles.logoItem}
            title={provider.display_name}
            aria-label={provider.display_name}
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
                  alt={`${provider.display_name} logo`}
                  onError={() =>
                    setFailedLogoProviderIds((current) => {
                      const next = new Set(current);
                      next.add(provider.provider_id);
                      return next;
                    })
                  }
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
      })}
    </div>
  );
};

export default AccountLogosList;
