const kstOffsetMilliseconds = 9 * 60 * 60 * 1_000;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const dateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/;

export function toKstInstant(value: string): Date {
  if (!dateTimePattern.test(value)) {
    throw new Error("유효한 날짜와 시간을 입력해 주세요.");
  }

  const normalized = value.length === 16 ? `${value}:00` : value;
  const instant = new Date(`${normalized}+09:00`);
  const observed = new Date(instant.getTime() + kstOffsetMilliseconds).toISOString().slice(0, 19);

  if (Number.isNaN(instant.getTime()) || observed !== normalized) {
    throw new Error("유효한 날짜와 시간을 입력해 주세요.");
  }

  return instant;
}

export function historyBoundary(value: string | null, boundary: "start" | "end"): Date | null {
  if (value === null) {
    return null;
  }

  if (datePattern.test(value)) {
    const start = toKstInstant(`${value}T00:00`);
    return boundary === "start" ? start : new Date(start.getTime() + 24 * 60 * 60 * 1_000);
  }

  try {
    const instant = toKstInstant(value);
    if (boundary === "start") {
      return instant;
    }
    const inputPrecisionMilliseconds = value.length === 16 ? 60_000 : 1_000;
    return new Date(instant.getTime() + inputPrecisionMilliseconds);
  } catch {
    return null;
  }
}
