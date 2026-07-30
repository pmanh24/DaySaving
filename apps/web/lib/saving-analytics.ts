import type { BoardResponse, Checkin, SavingDayRecord, SavingPlan } from "@saving/shared";
import { apiRequest } from "@/lib/api";

export interface AnalyticsPlan {
  key: string;
  id: string;
  name: string;
  kind: "DEFAULT" | "CUSTOM";
  totalSaved: number;
  targetAmount: number;
  remainingAmount: number;
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  averagePerDay: number;
  currentStreak: number;
}

export interface AnalyticsRecord {
  id: string;
  planKey: string;
  planName: string;
  indexLabel: string;
  amount: number;
  localDate: string;
  completedAt: string;
}

export interface AnalyticsTotals {
  totalSaved: number;
  targetAmount: number;
  remainingAmount: number;
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  averagePerDay: number;
}

export interface SavingAnalytics {
  plans: AnalyticsPlan[];
  records: AnalyticsRecord[];
  totals: AnalyticsTotals;
}

interface ChallengeStatistics {
  totalSaved: number;
  targetAmount: number;
  progressPercent: number;
  completedCells: number;
  remainingCells: number;
  averagePerDay: number;
  currentStreak: number;
}

interface SlotStatistics {
  totalSlots: number;
  paidSlots: number;
  totalSaved: number;
  totalRemaining: number;
}

function streakFromDates(dates: string[]) {
  const uniqueDates = [...new Set(dates)].sort((a, b) => b.localeCompare(a));
  if (!uniqueDates.length) return 0;
  let streak = 1;
  for (let index = 1; index < uniqueDates.length; index += 1) {
    const previous = Date.parse(`${uniqueDates[index - 1]}T00:00:00Z`);
    const current = Date.parse(`${uniqueDates[index]}T00:00:00Z`);
    if (previous - current !== 86_400_000) break;
    streak += 1;
  }
  return streak;
}

function percentage(saved: number, target: number) {
  return target ? Number(Math.min((saved / target) * 100, 100).toFixed(2)) : 0;
}

function defaultRecords(history: Checkin[], planKey: string, planName: string): AnalyticsRecord[] {
  return history
    .filter((item) => item.status === "COMPLETED")
    .map((item) => ({
      id: item.id,
      planKey,
      planName,
      indexLabel: `Ô số ${item.number}`,
      amount: item.amount,
      localDate: item.localDate,
      completedAt: item.createdAt,
    }));
}

function customRecords(records: SavingDayRecord[], plan: SavingPlan): AnalyticsRecord[] {
  return records
    .filter((item) => item.status === "COMPLETED")
    .map((item) => ({
      id: item.id,
      planKey: `plan:${plan.id}`,
      planName: plan.name,
      indexLabel: `Khoản ${item.dayIndex}`,
      amount: item.amount,
      localDate: item.localCompletedDate,
      completedAt: item.completedAt,
    }));
}

export async function loadSavingAnalytics(accessToken: string): Promise<SavingAnalytics> {
  const board = await apiRequest<BoardResponse>("/challenges/current", {}, accessToken);
  const defaultKey = `challenge:${board.challenge.id}`;
  const [history, challengeStats, plans] = await Promise.all([
    apiRequest<Checkin[]>(`/challenges/${board.challenge.id}/history`, {}, accessToken),
    apiRequest<ChallengeStatistics>(`/challenges/${board.challenge.id}/statistics`, {}, accessToken),
    apiRequest<SavingPlan[]>("/saving-plans", {}, accessToken),
  ]);
  const customData = await Promise.all(plans.map(async (plan) => {
    const [records, slotStats] = await Promise.all([
      apiRequest<SavingDayRecord[]>(`/saving-plans/${plan.id}/day-records`, {}, accessToken),
      apiRequest<SlotStatistics>(`/saving-plans/${plan.id}/slot-statistics`, {}, accessToken),
    ]);
    return { plan, records, slotStats };
  }));

  const defaultPlan: AnalyticsPlan = {
    key: defaultKey,
    id: board.challenge.id,
    name: board.challenge.name || "Thử thách tiết kiệm 100 ngày",
    kind: "DEFAULT",
    totalSaved: challengeStats.totalSaved,
    targetAmount: challengeStats.targetAmount,
    remainingAmount: Math.max(challengeStats.targetAmount - challengeStats.totalSaved, 0),
    completedCount: challengeStats.completedCells,
    totalCount: 100,
    progressPercent: challengeStats.progressPercent,
    averagePerDay: challengeStats.averagePerDay,
    currentStreak: challengeStats.currentStreak,
  };
  const customPlans = customData.map(({ plan, records, slotStats }) => ({
    option: {
      key: `plan:${plan.id}`,
      id: plan.id,
      name: plan.name,
      kind: "CUSTOM" as const,
      totalSaved: slotStats.totalSaved,
      targetAmount: plan.targetAmount,
      remainingAmount: slotStats.totalRemaining,
      completedCount: slotStats.paidSlots,
      totalCount: slotStats.totalSlots,
      progressPercent: percentage(slotStats.totalSaved, plan.targetAmount),
      averagePerDay: slotStats.paidSlots ? Math.round(slotStats.totalSaved / slotStats.paidSlots) : 0,
      currentStreak: streakFromDates(records.filter((item) => item.status === "COMPLETED").map((item) => item.localCompletedDate)),
    } satisfies AnalyticsPlan,
    records: customRecords(records, plan),
  }));
  const analyticsPlans = [defaultPlan, ...customPlans.map((item) => item.option)];
  const analyticsRecords = [
    ...defaultRecords(history, defaultKey, defaultPlan.name),
    ...customPlans.flatMap((item) => item.records),
  ].sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  const totals = analyticsPlans.reduce<AnalyticsTotals>((summary, plan) => ({
    totalSaved: summary.totalSaved + plan.totalSaved,
    targetAmount: summary.targetAmount + plan.targetAmount,
    remainingAmount: summary.remainingAmount + plan.remainingAmount,
    completedCount: summary.completedCount + plan.completedCount,
    totalCount: summary.totalCount + plan.totalCount,
    progressPercent: 0,
    averagePerDay: 0,
  }), { totalSaved: 0, targetAmount: 0, remainingAmount: 0, completedCount: 0, totalCount: 0, progressPercent: 0, averagePerDay: 0 });
  totals.progressPercent = percentage(totals.totalSaved, totals.targetAmount);
  totals.averagePerDay = analyticsRecords.length ? Math.round(totals.totalSaved / analyticsRecords.length) : 0;
  return { plans: analyticsPlans, records: analyticsRecords, totals };
}

export function priorityStorageKey(userId: string) {
  return `saving-analytics-priority:${userId}`;
}
