import { type TrueLayerProvider } from "@/services";
import AccountLogo from "../AccountLogo";
import styles from "./AccountLogosList.module.css";

type AccountLogosListProps = {
  providers: Array<TrueLayerProvider | null | undefined>;
};

const AccountLogosList = ({ providers }: AccountLogosListProps) => {
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
      {visibleProviders.map((provider) => (
        <AccountLogo
          key={provider.provider_id}
          provider={provider}
          className={styles.logoItem}
        />
      ))}
    </div>
  );
};

export default AccountLogosList;
