export type PeriodPreset = "당일" | "당월" | "1주일" | "1개월" | "1년";

interface DateRange {
  readonly from: string;
  readonly to: string;
}

const kstDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function formatKstDate(date: Date): string {
  let year = "";
  let month = "";
  let day = "";
  for (const part of kstDateFormatter.formatToParts(date)) {
    if (part.type === "year") year = part.value;
    else if (part.type === "month") month = part.value;
    else if (part.type === "day") day = part.value;
  }
  return `${year}-${month}-${day}`;
}

function parseDate(date: string): Date {
  const [year = 0, month = 0, day = 0] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function subtractDays(date: string, days: number): string {
  const result = parseDate(date);
  result.setUTCDate(result.getUTCDate() - days);
  return formatDate(result);
}

function subtractMonths(date: string, months: number): string {
  const source = parseDate(date);
  const year = source.getUTCFullYear();
  const month = source.getUTCMonth() - months;
  const day = source.getUTCDate();
  const targetYear = year + Math.floor(month / 12);
  const targetMonth = ((month % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return formatDate(new Date(Date.UTC(targetYear, targetMonth, Math.min(day, lastDay))));
}

export function periodRange(preset: PeriodPreset, now = new Date()): DateRange {
  const today = formatKstDate(now);

  switch (preset) {
    case "당일":
      return { from: today, to: today };
    case "당월":
      return { from: `${today.slice(0, 8)}01`, to: today };
    case "1주일":
      return { from: subtractDays(today, 6), to: today };
    case "1개월":
      return { from: subtractMonths(today, 1), to: today };
    case "1년":
      return { from: subtractMonths(today, 12), to: today };
  }
}
