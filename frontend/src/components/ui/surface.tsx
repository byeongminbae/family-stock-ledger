import type { HTMLAttributes, ReactNode } from "react";

import { classNames } from "./class-names";

type SurfaceElement = "article" | "div" | "section";

type SurfaceProps = Readonly<
  HTMLAttributes<HTMLElement> & {
    as?: SurfaceElement;
    children: ReactNode;
    muted?: boolean;
  }
>;

export function Surface({
  as: Element = "section",
  children,
  className,
  muted = false,
  ...props
}: SurfaceProps) {
  return (
    <Element {...props} className={classNames("panel", muted && "panel--muted", className)}>
      {children}
    </Element>
  );
}
