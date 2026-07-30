"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, LockKeyhole, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { SavingPlan } from "@saving/shared";
import { SimplePage } from "@/components/simple-page";
import { useAuth } from "@/components/auth-provider";
import { apiRequest } from "@/lib/api";
import { money } from "@/lib/format";

const statusLabels: Record<SavingPlan["status"], string> = {
  DRAFT: "Bản nháp",
  SCHEDULED: "Đã lên lịch",
  ACTIVE: "Đang thực hiện",
  PAUSED: "Tạm dừng",
  COMPLETED: "Đã hoàn thành",
  ARCHIVED: "Đã lưu trữ",
};

export function ApiPlanManagementView() {
  const { accessToken } = useAuth();
  const [notice, setNotice] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const plansQuery = useQuery({
    queryKey: ["plans-management", accessToken],
    queryFn: () => apiRequest<SavingPlan[]>("/saving-plans", {}, accessToken ?? undefined),
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 7500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const removePlan = (plan: SavingPlan) => {
    if (!window.confirm(`Bạn có chắc muốn xóa kế hoạch “${plan.name}” không? Dữ liệu các khoản đã hoàn thành cũng sẽ bị xóa.`)) return;
    setDeletingId(plan.id);
    void apiRequest<{ deletedPlanId: string }>(`/saving-plans/${plan.id}`, { method: "DELETE" }, accessToken ?? undefined)
      .then(() => {
        setNotice(`Đã xóa kế hoạch “${plan.name}”.`);
        return plansQuery.refetch();
      })
      .catch((error: unknown) => setNotice(error instanceof Error ? error.message : "Không thể xóa kế hoạch."))
      .finally(() => setDeletingId(null));
  };

  if (plansQuery.isLoading) {
    return <SimplePage active="plan" eyebrow="QUẢN LÝ KẾ HOẠCH" title="Đang tải kế hoạch" subtitle="Hệ thống đang chuẩn bị danh sách kế hoạch của bạn."><div className="empty">Đang tải…</div></SimplePage>;
  }

  if (plansQuery.isError) {
    return <SimplePage active="plan" eyebrow="QUẢN LÝ KẾ HOẠCH" title="Không thể tải danh sách" subtitle="Vui lòng thử lại sau ít phút."><div className="empty"><strong>Chưa thể tải các kế hoạch.</strong><button className="button primary" onClick={() => void plansQuery.refetch()} style={{ marginTop: 14 }}>Thử lại</button></div></SimplePage>;
  }

  const plans = plansQuery.data ?? [];
  return <SimplePage active="plan" eyebrow="QUẢN LÝ KẾ HOẠCH" title="Các kế hoạch của bạn" subtitle="Xem, tiếp tục hoặc xóa những kế hoạch bạn đã tạo.">
    <div className="management-default-card">
      <div className="management-card-icon"><LockKeyhole size={18} /></div>
      <div><strong>Thử thách mặc định 100 ngày</strong><span>Đây là bảng chính của ứng dụng và không thể xóa.</span></div>
      <span className="management-badge">Mặc định</span>
    </div>
    <div className="section-row" style={{ marginTop: 22 }}><div><h2 className="section-title">Kế hoạch mở rộng</h2><p className="section-caption">Bạn có {plans.length} kế hoạch có thể quản lý.</p></div><Link className="icon-button" href="/plan/new" aria-label="Tạo kế hoạch mới"><Plus size={18} /></Link></div>
    {plans.length ? <div className="management-list">{plans.map((plan) => <article className="management-card" key={plan.id}>
      <div className="management-card-top"><div><strong>{plan.name}</strong><span>{plan.durationDays} ngày · {statusLabels[plan.status]}</span></div><span className={`management-badge ${plan.status === "COMPLETED" ? "success" : ""}`}>{plan.status === "COMPLETED" ? <CheckCircle2 size={13} /> : null}{statusLabels[plan.status]}</span></div>
      <div className="management-progress"><div className="progress-label"><span>{plan.completedDays}/{plan.durationDays} ngày</span><strong>{Math.round((plan.completedDays / plan.durationDays) * 100)}%</strong></div><div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min((plan.completedDays / plan.durationDays) * 100, 100)}%` }} /></div></div>
      <div className="management-card-bottom"><span>{money(plan.totalSavedAmount)} đã tiết kiệm</span><div><Link className="button secondary management-open" href={`/plan?planId=${plan.id}`}>Mở kế hoạch</Link><button className="management-delete" onClick={() => removePlan(plan)} disabled={deletingId === plan.id} aria-label={`Xóa kế hoạch ${plan.name}`}><Trash2 size={16} />{deletingId === plan.id ? "Đang xóa…" : "Xóa"}</button></div></div>
    </article>)}</div> : <div className="empty management-empty"><strong>Bạn chưa tạo kế hoạch mở rộng.</strong><span>Hãy tạo một kế hoạch từ 30 đến 300 ngày để bắt đầu.</span><Link className="button primary" href="/plan/new" style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 14, textDecoration: "none" }}><Plus size={16} />Tạo kế hoạch</Link></div>}
    {notice && <div className="notice-card" role="status">{notice}</div>}
  </SimplePage>;
}
