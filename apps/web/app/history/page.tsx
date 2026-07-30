"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SimplePage } from "@/components/simple-page";
import { PlanPriorityPicker } from "@/components/plan-priority-picker";
import { useAuth } from "@/components/auth-provider";
import { apiRequest } from "@/lib/api";
import { money } from "@/lib/format";
import { loadSavingAnalytics, priorityStorageKey } from "@/lib/saving-analytics";

export default function HistoryPage() {
  const { accessToken, user } = useAuth();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["history-all-plans", accessToken], queryFn: () => loadSavingAnalytics(accessToken!), enabled: Boolean(accessToken) });
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

  const records = useMemo(() => {
    if (!data) return [];
    return [...data.records].sort((a, b) => {
      const aPriority = a.planKey === priorityKey ? 0 : 1;
      const bPriority = b.planKey === priorityKey ? 0 : 1;
      return aPriority - bPriority || b.completedAt.localeCompare(a.completedAt);
    });
  }, [data, priorityKey]);

  if (!data) return <SimplePage active="history" eyebrow="NHẬT KÝ TIẾT KIỆM" title="Lịch sử" subtitle="Tất cả khoản tiết kiệm của bạn ở cùng một nơi."><div className="empty">{isLoading ? "Đang tải dữ liệu…" : isError ? <><strong>Không thể tải lịch sử.</strong><button className="button primary" onClick={() => void refetch()} style={{ marginTop: 14 }}>Thử lại</button></> : "Chưa có dữ liệu lịch sử."}</div></SimplePage>;

  return <SimplePage active="history" eyebrow="NHẬT KÝ TIẾT KIỆM" title="Lịch sử" subtitle="Theo dõi cả thử thách 100 ngày và các kế hoạch bạn tự tạo.">
    <PlanPriorityPicker plans={data.plans} value={priorityKey || data.plans[0]?.key || ""} onChange={choosePriority} />
    <div className="section-row" style={{ marginTop: 18 }}><div><h2 className="section-title">Tất cả giao dịch</h2><p className="section-caption">{records.length} khoản từ {data.plans.length} kế hoạch · kế hoạch ưu tiên được đưa lên trước</p></div></div>
    <div className="recent-list" style={{ marginTop: 14 }}>{records.length ? records.map((item) => <div className="recent-item" key={`${item.planKey}-${item.id}`}><div className="recent-icon"><CheckCircle2 size={18}/></div><div className="recent-main"><strong>{item.planName}</strong><span>{item.indexLabel} · {item.localDate || "Hôm nay"} · Hoàn thành</span></div><span className="recent-amount">+{money(item.amount)}</span></div>) : <div className="empty"><RotateCcw size={24}/><strong>Chưa có khoản tiết kiệm nào</strong><span>Hãy chọn một ô trên bảng để bắt đầu.</span></div>}</div>
  </SimplePage>;
}
