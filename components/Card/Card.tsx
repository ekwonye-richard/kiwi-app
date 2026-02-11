import { ReactNode } from "react";

import styles from "./Card.module.css";
import classNames from "classnames";

type CardProps = {
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

const Card = ({ children, title, footer, className }: CardProps) => {
  return (
    <div className={classNames(styles.card, className)}>
      <header className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
      </header>
      <div className={styles.cardContent}>{children}</div>
      {footer && <footer className={styles.cardFooter}>{footer}</footer>}
    </div>
  );
};

export default Card;
