import type { ReactNode } from "react";

import { classNames } from "./class-names";

type FieldProps = Readonly<{
  children: ReactNode;
  className?: string;
  error?: string;
  hint?: string;
  htmlFor: string;
  label: string;
  required?: boolean;
}>;

export function Field({
  children,
  className,
  error,
  hint,
  htmlFor,
  label,
  required = false,
}: FieldProps) {
  return (
    <div className={classNames("field", className)}>
      <label className="field-label" htmlFor={htmlFor}>
        {label}
        {required ? <span className="field-required"> (필수)</span> : null}
      </label>
      {children}
      {hint ? (
        <p className="field-hint" id={`${htmlFor}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="field-error" id={`${htmlFor}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
