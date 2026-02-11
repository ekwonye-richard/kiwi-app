"use client";

import { type TrueLayerProvider } from "@/services";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import AccountLogo from "../AccountLogo";
import styles from "./FooterAccountLogos.module.css";
import classNames from "classnames";

type FooterAccountLogosProps = {
  providers: Array<TrueLayerProvider | null | undefined>;
};

const FooterAccountLogos = ({ providers }: FooterAccountLogosProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const uniqueProviders = useMemo(
    () =>
      Array.from(
        new Map(
          providers
            .filter((provider): provider is TrueLayerProvider =>
              Boolean(provider),
            )
            .map((provider) => [provider.provider_id, provider]),
        ).values(),
      ),
    [providers],
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  if (uniqueProviders.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className={styles.footerAccountLogos}>
      <span
        className={classNames(styles.items, { [styles.isVisible]: isVisible })}
      >
        {uniqueProviders.map((provider, index) => (
          <AccountLogo
            key={provider.provider_id}
            provider={provider}
            className={styles.logoItem}
            style={
              {
                "--logo-delay": `${1000 + index * 40}ms`,
              } as CSSProperties
            }
          />
        ))}
      </span>
    </div>
  );
};

export default FooterAccountLogos;
