import { MouseEventHandler, ReactNode } from "react";

import styles from "./Button.module.css";
import classNames from "classnames";

type ButtonProps = {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  variant?: "primary" | "secondary";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
};

const Button = ({
  children,
  onClick,
  variant = "primary",
  size = "small",
  disabled = false,
}: ButtonProps) => {
  return (
    <button
      className={classNames(styles.button, styles[variant], styles[size])}
      type="button"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
