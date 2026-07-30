"use client";

import type { AnalyticsPlan } from "@/lib/saving-analytics";

export function PlanPriorityPicker({ plans, value, onChange }: { plans: AnalyticsPlan[]; value: string; onChange: (value: string) => void }) {
  return <div className="plan-priority-card"><div><strong>Ưu tiên kế hoạch</strong><span>Chọn kế hoạch muốn xem trước trong lịch sử và thống kê.</span></div><select className="filter-select" aria-label="Kế hoạch ưu tiên" value={value} onChange={(event) => onChange(event.target.value)}>{plans.map((plan) => <option key={plan.key} value={plan.key}>{plan.name}</option>)}</select></div>;
}
