export function localDate(timezone: string, date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function currentStreak(dates: string[]): number {
  const unique = [...new Set(dates)].sort().reverse();
  if (!unique.length) return 0;
  let streak = 1;
  for (let i = 1; i < unique.length; i += 1) {
    const previous = new Date(`${unique[i - 1]}T00:00:00Z`).getTime();
    const current = new Date(`${unique[i]}T00:00:00Z`).getTime();
    if (previous - current !== 86400000) break;
    streak += 1;
  }
  return streak;
}
