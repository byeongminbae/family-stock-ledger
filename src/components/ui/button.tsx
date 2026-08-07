import type { ButtonHTMLAttributes, ReactNode } from "react";

import { classNames } from "./class-names";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = Readonly<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    busyLabel?: string;
    children: ReactNode;
    isBusy?: boolean;
    variant?: ButtonVariant;
  }
>;

export function Button({
  busyLabel = "처리 중",
  children,
  className,
  disabled,
  isBusy = false,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      aria-busy={isBusy}
      className={classNames("button", `button--${variant}`, className)}
      disabled={disabled || isBusy}
      type={type}
    >
      <span aria-live="polite">{isBusy ? busyLabel : children}</span>
    </button>
  );
}
