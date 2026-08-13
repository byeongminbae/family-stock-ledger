const unsignedIntegerDraftPattern = /^\d*$/;
const signedIntegerDraftPattern = /^-?\d*$/;

export function isIntegerDraft(value: string, signed = false): boolean {
  return (signed ? signedIntegerDraftPattern : unsignedIntegerDraftPattern).test(value);
}
