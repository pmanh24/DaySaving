"use client";

import { useEffect, useState } from "react";
import { ChartNoAxesCombined, Flame, Target, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SimplePage } from "@/components/simple-page";
import { PlanPriorityPicker } from "@/components/plan-priority-picker";
import { useAuth } from "@/components/auth-provider";
import { money } from "@/lib/format";
import { loadSavingAnalytics, priorityStorageKey } from "@/lib/saving-analytics";

export default function StatsPage() {
  const { accessToken, user } = useAuth();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["statistics-all-plans", accessToken], queryFn: () => loadSavingAnalytics(accessToken!), enabled: Boolean(accessToken) });
  const [priorityKey, setPriorityKey] = useState("");

  useEffect(() => {
    if (!data?.plans.length || !user?.id) return;
    const stored = window.localStorage.getItem(priorityStorageKey(user.id));
    setPriorityKey(stored && data.plans.some((plan) => plan.key === stored) ? stored : data.plans[0].key);
  }, [data, user?.id]);

  const choosePriority = (key: string) => {
    setPriorityKey(key);
    if (user?.id) window.localStorage.setItem(priorityStorageKey(user.id), key);
  };

  if (!data) return <SimplePage active="stats" eyebrow="GÓC NHÌN CỦA BẠN" title="Thống kê" subtitle="Xem tiến độ của tất cả kế hoạch."><div className="empty">{isLoading ? "Đang tải dữ liệu…" : isError ? <><strong>Không thể tải thống kê.</strong><button className="button primary" onClick={() => void refetch()} style={{ marginTop: 14 }}>Thử lại</button></> : "Chưa có dữ liệu thống kê."}</div></SimplePage>;

  const priorityPlan = data.plans.find((plan) => plan.key === priorityKey) ?? data.plans[0];
  return <SimplePage active="stats" eyebrow="GÓC NHÌN CỦA BẠN" title="Thống kê" subtitle="Xem tiến độ của thử thách 100 ngày và mọi kế hoạch mở rộng.">
    <PlanPriorityPicker plans={data.plans} value={priorityPlan.key} onChange={choosePriority} />
    <div className="stat-hero-card"><div className="stat-icon"><ChartNoAxesCombined size={22}/></div><span>{priorityPlan.name}</span><strong>{money(priorityPlan.totalSaved)}</strong><div className="progress-track"><div className="progress-fill" style={{ width: `${priorityPlan.progressPercent}%` }}/></div><small>{priorityPlan.progressPercent}% mục tiêu</small></div>
    <div className="stats-grid"><div className="stat-card"><TrendingUp size={18}/><span>Trung bình mỗi lần</span><strong>{money(priorityPlan.averagePerDay)}</strong></div><div className="stat-card"><Target size={18}/><span>Còn lại</span><strong>{priorityPlan.totalCount - priorityPlan.completedCount} ô</strong></div><div className="stat-card"><Flame size={18}/><span>Chuỗi hiện tại</span><strong>{priorityPlan.currentStreak} ngày</strong></div><div className="stat-card"><ChartNoAxesCombined size={18}/><span>Mục tiêu</span><strong>{money(priorityPlan.targetAmount)}</strong></div></div>
    <div className="insight-card"><strong>Tổng tất cả kế hoạch</strong><p>{money(data.totals.totalSaved)} đã tiết kiệm trên {data.plans.length} kế hoạch · còn {money(data.totals.remainingAmount)}.</p></div>
    <section className="plan-analytics-section"><div className="section-row"><div><h2 className="section-title">Từng kế hoạch</h2><p className="section-caption">Dữ liệu gồm cả bảng 100 ngày mặc định và kế hoạch mở rộng.</p></div></div><div className="plan-analytics-list">{data.plans.map((plan) => <div className={`plan-analytics-item ${plan.key === priorityPlan.key ? "priority" : ""}`} key={plan.key}><div><strong>{plan.name}</strong><span>{plan.completedCount}/{plan.totalCount} ô đã hoàn thành</span></div><div><strong>{money(plan.totalSaved)}</strong><span>{plan.progressPercent}% mục tiêu</span></div></div>)}</div></section>
  </SimplePage>;
}
