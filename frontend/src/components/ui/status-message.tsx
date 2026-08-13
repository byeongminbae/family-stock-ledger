import type { ReactNode } from "react";

import { classNames } from "./class-names";

type StatusTone = "info" | "success" | "warning" | "error";

type StatusMessageProps = Readonly<{
  children: ReactNode;
  className?: string;
  tone?: StatusTone;
}>;

export function StatusMessage({ children, className, tone = "info" }: StatusMessageProps) {
  return (
    <div
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={classNames("status-message", `status-message--${tone}`, className)}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
