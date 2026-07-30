"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, CircleHelp, Clock3, Copy, QrCode, RefreshCw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { SavingPayment, SavingPlan, SavingPlanTodayResponse, SavingSlot } from "@saving/shared";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { useAuth } from "@/components/auth-provider";
import { SimplePage } from "@/components/simple-page";
import { apiRequest } from "@/lib/api";
import { boardMoney, money } from "@/lib/format";

interface SlotResult {
  items: SavingSlot[];
  meta: { total: number };
}

interface PlanState {
  plan: SavingPlan;
  slots: SavingSlot[];
  today: SavingPlanTodayResponse;
}

export function ApiPlanView() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [selected, setSelected] = useState<SavingSlot | null>(null);
  const [notice, setNotice] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const redirectTimer = useRef<number | null>(null);
  const plansQuery = useQuery({
    queryKey: ["plans", accessToken],
    queryFn: () => apiRequest<SavingPlan[]>("/saving-plans", {}, accessToken ?? undefined),
    enabled: Boolean(accessToken),
  });
  const requestedPlanId = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("planId");
  const plan = plansQuery.data?.find((item) => item.id === requestedPlanId) ?? plansQuery.data?.[0];
  const stateQuery = useQuery({
    queryKey: ["plan-state", accessToken, plan?.id],
    queryFn: async (): Promise<PlanState> => {
      const [freshPlan, slots, today] = await Promise.all([
        apiRequest<SavingPlan>(`/saving-plans/${plan!.id}`, {}, accessToken ?? undefined),
        apiRequest<SlotResult>(`/saving-plans/${plan!.id}/slots?limit=300&sort=asc`, {}, accessToken ?? undefined),
        apiRequest<SavingPlanTodayResponse>(`/saving-plans/${plan!.id}/today`, {}, accessToken ?? undefined),
      ]);
      return { plan: freshPlan, slots: slots.items, today };
    },
    enabled: Boolean(accessToken && plan?.id),
  });
  const state = stateQuery.data;
  const pending = state?.today.pendingPayment ?? null;
  const planIsActive = state?.plan.status === "ACTIVE";
  const slots = useMemo(() => [...(state?.slots ?? [])].sort((a, b) => a.slotIndex - b.slotIndex), [state?.slots]);
  const refresh = () => Promise.all([plansQuery.refetch(), stateQuery.refetch()]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 7500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => () => {
    if (redirectTimer.current !== null) window.clearTimeout(redirectTimer.current);
  }, []);

  const celebrateCompletion = () => {
    setNotice("Chúc mừng bạn! Bạn đã hoàn thành kế hoạch 100%.");
    if (redirectTimer.current !== null) window.clearTimeout(redirectTimer.current);
    redirectTimer.current = window.setTimeout(() => router.replace("/plan/new"), 2200);
  };

  const createPayment = () => {
    if (!state || !selected) return;
    setActionLoading(true);
    void apiRequest<SavingPayment>(
      `/saving-plans/${state.plan.id}/payments`,
      { method: "POST", body: JSON.stringify({ slotId: selected.id, idempotencyKey: crypto.randomUUID() }) },
      accessToken ?? undefined,
    )
      .then(() => {
        setSelected(null);
        setNotice("Đã tạo mã QR. Hệ thống sẽ cập nhật sau khi thanh toán được xác nhận.");
        return stateQuery.refetch();
      })
      .catch((error: unknown) => setNotice(error instanceof Error ? error.message : "Không thể tạo mã QR."))
      .finally(() => setActionLoading(false));
  };

  const completeManually = () => {
    if (!state || !selected) return;
    setActionLoading(true);
    void apiRequest<unknown>(
      `/saving-plans/${state.plan.id}/slots/${selected.id}/manual-complete`,
      { method: "POST", body: JSON.stringify({ note: "Người dùng tự tiết kiệm tiền mặt" }) },
      accessToken ?? undefined,
    )
      .then(() => {
        setSelected(null);
        return refresh();
      })
      .then(([, nextState]) => {
        if (nextState.data?.plan.status === "COMPLETED") celebrateCompletion();
        else setNotice("Đã ghi nhận khoản tiết kiệm tiền mặt.");
      })
      .catch((error: unknown) => setNotice(error instanceof Error ? error.message : "Không thể ghi nhận khoản tiết kiệm."))
      .finally(() => setActionLoading(false));
  };

  const reconcile = () => {
    if (!pending) return;
    void apiRequest<SavingPayment>(`/payments/${pending.id}/reconcile`, { method: "POST" }, accessToken ?? undefined)
      .then(() => refresh())
      .then(([, nextState]) => {
        if (nextState.data?.plan.status === "COMPLETED") celebrateCompletion();
        else setNotice("Đã cập nhật trạng thái thanh toán.");
      })
      .catch((error: unknown) => setNotice(error instanceof Error ? error.message : "Không thể kiểm tra thanh toán."));
  };

  const cancel = () => {
    if (!pending) return;
    void apiRequest<SavingPayment>(`/payments/${pending.id}/cancel`, { method: "POST" }, accessToken ?? undefined)
      .then(() => {
        setNotice("Đã hủy thanh toán, ô đã được mở lại.");
        return refresh();
      })
      .catch((error: unknown) => setNotice(error instanceof Error ? error.message : "Không thể hủy thanh toán."));
  };

  const copyCheckout = () => {
    if (pending?.checkoutUrl) void navigator.clipboard?.writeText(pending.checkoutUrl);
    setNotice("Đã sao chép link thanh toán.");
  };

  if (plansQuery.isLoading || stateQuery.isLoading) {
    return <SimplePage active="plan" eyebrow="KẾ HOẠCH TIẾT KIỆM" title="Đang tải kế hoạch" subtitle="Hệ thống đang chuẩn bị dữ liệu kế hoạch của bạn."><div className="empty">Đang tải…</div></SimplePage>;
  }

  if (plansQuery.isError || stateQuery.isError) {
    return <SimplePage active="plan" eyebrow="KẾ HOẠCH TIẾT KIỆM" title="Không thể tải kế hoạch" subtitle="Đã xảy ra lỗi khi kết nối dữ liệu kế hoạch. Vui lòng thử lại."><div className="empty"><strong>Chưa thể hiển thị bảng tiết kiệm.</strong><button className="button primary" onClick={() => void refresh()} style={{ marginTop: 14 }}>Thử lại</button></div></SimplePage>;
  }

  if (!plan || !state) {
    return <SimplePage active="plan" eyebrow="KẾ HOẠCH TIẾT KIỆM" title="Chưa có kế hoạch" subtitle="Tạo kế hoạch đầu tiên để bắt đầu."><div className="empty"><strong>Bạn chưa có kế hoạch nào.</strong><Link className="button primary" href="/plan/new" style={{ display: "inline-flex", alignItems: "center", marginTop: 14, textDecoration: "none" }}>Tạo kế hoạch</Link></div></SimplePage>;
  }

  return <>
    <SimplePage active="plan" eyebrow="KẾ HOẠCH TIẾT KIỆM" title={state.plan.name} subtitle="Chạm vào một ô để xem đầy đủ số tiền và chọn cách tiết kiệm.">
      <div className="plan-overview">
        <div><span>Đã tiết kiệm</span><strong>{money(state.plan.totalSavedAmount)}</strong></div>
        <div><span>Còn lại</span><strong>{money(state.plan.remainingAmount)}</strong></div>
      </div>
      <div className="plan-progress">
        <div className="progress-label"><span>{state.plan.completedDays} / {state.plan.durationDays} ngày hoàn thành</span><strong>{Math.round((state.plan.completedDays / state.plan.durationDays) * 100)}%</strong></div>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${(state.plan.completedDays / state.plan.durationDays) * 100}%` }} /></div>
      </div>
      {!planIsActive && <div className="today-card"><div className="today-icon"><Clock3 size={20} /></div><div><strong>Kế hoạch chưa bắt đầu</strong><span>Bảng sẽ mở vào ngày {state.plan.startDate}.</span></div></div>}
      {pending && <div className="today-card"><div className="today-icon"><QrCode size={20} /></div><div><strong>Đang chờ thanh toán</strong><span>{money(pending.amount)} · Đang chờ xác nhận</span></div></div>}
      <div className="plan-board-action"><span>Con số trong ô được tính theo nghìn đồng.</span><div className="plan-board-links"><Link className="plan-change-link" href="/plan/new">Đổi kế hoạch</Link><Link className="plan-change-link" href="/plan/manage">Quản lý</Link></div></div>
      <div className="board-card plan-board-card">
        <div className="section-row" style={{ marginBottom: 12 }}><div><h2 className="section-title">Bảng tiết kiệm</h2><p className="section-caption">{state.plan.durationDays} ô · Chạm vào một ô để xem chi tiết</p></div><CircleHelp size={18} color="#9a9aae" /></div>
        <div className="board" aria-label={`Bảng tiết kiệm ${state.plan.durationDays} ô`}>
          {slots.map((slot) => {
            const completed = slot.status === "PAID" || slot.status === "MANUALLY_COMPLETED";
            return <button key={slot.id} className={`cell ${completed ? "done" : ""} ${slot.status === "RESERVED" ? "reserved" : ""}`} disabled={slot.status !== "AVAILABLE" || !planIsActive} onClick={() => setSelected(slot)} aria-label={`Ô số ${slot.slotIndex}, ${money(slot.amount)}${completed ? ", đã hoàn thành" : slot.status === "RESERVED" ? ", đang chờ xác nhận" : ""}`}>
              <small>{slot.slotIndex}</small>
              {completed ? <Check size={16} /> : boardMoney(slot.amount)}
              {slot.status === "RESERVED" && <Clock3 className="cell-status" size={12} aria-hidden="true" />}
            </button>;
          })}
        </div>
        <div className="board-legend"><span className="legend-item"><i className="legend-dot done" />Đã xong</span><span className="legend-item"><i className="legend-dot" />Có thể chọn</span><span className="legend-item"><i className="legend-dot reserved" />Đang chờ</span></div>
      </div>
    </SimplePage>
    {selected && <ConfirmSheet allowCash={state.plan.confirmationMode === "PAYOS_OR_MANUAL"} number={selected.slotIndex} amount={selected.amount} total={state.plan.totalSavedAmount} onClose={() => setSelected(null)} onCashConfirm={completeManually} onPayosConfirm={createPayment} loading={actionLoading} />}
    {pending && <div className="sheet-backdrop" role="presentation"><section className="sheet payment-sheet" role="dialog" aria-modal="true"><div className="drag" /><div className="payment-status-pill"><span className="pulse-dot" /> Đang chờ xác nhận</div><h2>Thanh toán khoản tiết kiệm</h2><p>Chuyển đúng số tiền bên dưới. Hệ thống sẽ cập nhật khi thanh toán được xác nhận.</p><div className="qr-wrap"><QRCodeSVG value={pending.qrCode ?? pending.checkoutUrl ?? pending.description} size={190} includeMargin /></div><div className="sheet-amount">{money(pending.amount)}</div><p className="qr-help">Nếu đã chuyển tiền, hãy bấm “Kiểm tra” để cập nhật trạng thái.</p><div className="payment-actions"><button className="button secondary" onClick={copyCheckout}><Copy size={16} /> Link</button><button className="button secondary" onClick={reconcile}><RefreshCw size={16} /> Kiểm tra</button></div><button className="cancel-link" onClick={cancel}>Hủy thanh toán</button></section></div>}
    {notice && <div className="notice-card" role="status">{notice}</div>}
  </>;
}
