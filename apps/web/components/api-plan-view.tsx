"use client";

import { useMemo, useState } from "react";
import { Check, Clock3, Copy, QrCode, RefreshCw, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type {
  SavingPayment,
  SavingPlan,
  SavingPlanTodayResponse,
  SavingSlot,
  SavingSlotStatus,
} from "@saving/shared";
import { useAuth } from "@/components/auth-provider";
import { SimplePage } from "@/components/simple-page";
import { apiRequest } from "@/lib/api";
import { money } from "@/lib/format";

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
  const { accessToken } = useAuth();
  const [tab, setTab] = useState<"ALL" | SavingSlotStatus>("AVAILABLE");
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<SavingSlot | null>(null);
  const [notice, setNotice] = useState("");
  const plansQuery = useQuery({
    queryKey: ["plans", accessToken],
    queryFn: () =>
      apiRequest<SavingPlan[]>("/saving-plans", {}, accessToken ?? undefined),
    enabled: Boolean(accessToken),
  });
  const plan = plansQuery.data?.[0];
  const stateQuery = useQuery({
    queryKey: ["plan-state", accessToken, plan?.id, sort],
    queryFn: async (): Promise<PlanState> => {
      const [freshPlan, slots, today] = await Promise.all([
        apiRequest<SavingPlan>(
          `/saving-plans/${plan!.id}`,
          {},
          accessToken ?? undefined,
        ),
        apiRequest<SlotResult>(
          `/saving-plans/${plan!.id}/slots?limit=300&sort=${sort}`,
          {},
          accessToken ?? undefined,
        ),
        apiRequest<SavingPlanTodayResponse>(
          `/saving-plans/${plan!.id}/today`,
          {},
          accessToken ?? undefined,
        ),
      ]);
      return { plan: freshPlan, slots: slots.items, today };
    },
    enabled: Boolean(accessToken && plan?.id),
  });
  const state = stateQuery.data;
  const pending = state?.today.pendingPayment ?? null;
  const slots = useMemo(() => {
    const source = state?.slots ?? [];
    return source
      .filter((slot) => tab === "ALL" || slot.status === tab)
      .sort((a, b) =>
        sort === "asc"
          ? a.amount - b.amount
          : b.amount - a.amount || a.slotIndex - b.slotIndex,
      );
  }, [sort, state?.slots, tab]);
  const refresh = () =>
    void Promise.all([plansQuery.refetch(), stateQuery.refetch()]);

  const createPayment = () => {
    if (!state || !selected) return;
    void apiRequest<SavingPayment>(
      `/saving-plans/${state.plan.id}/payments`,
      {
        method: "POST",
        body: JSON.stringify({
          slotId: selected.id,
          idempotencyKey: crypto.randomUUID(),
        }),
      },
      accessToken ?? undefined,
    )
      .then(() => {
        setSelected(null);
        setNotice(
          "Đã tạo QR. Chỉ xác nhận sau khi backend nhận webhook hoặc reconcile.",
        );
        return stateQuery.refetch();
      })
      .catch((error: unknown) =>
        setNotice(
          error instanceof Error ? error.message : "Không thể tạo thanh toán.",
        ),
      );
  };
  const reconcile = () => {
    if (!pending) return;
    void apiRequest<SavingPayment>(
      `/payments/${pending.id}/reconcile`,
      { method: "POST" },
      accessToken ?? undefined,
    )
      .then(() => {
        setNotice("Đã cập nhật trạng thái thanh toán.");
        return refresh();
      })
      .catch((error: unknown) =>
        setNotice(
          error instanceof Error
            ? error.message
            : "Không thể kiểm tra thanh toán.",
        ),
      );
  };
  const cancel = () => {
    if (!pending) return;
    void apiRequest<SavingPayment>(
      `/payments/${pending.id}/cancel`,
      { method: "POST" },
      accessToken ?? undefined,
    )
      .then(() => {
        setNotice("Payment đã hủy, slot được mở lại.");
        return refresh();
      })
      .catch((error: unknown) =>
        setNotice(
          error instanceof Error ? error.message : "Không thể hủy thanh toán.",
        ),
      );
  };
  const copyCheckout = () => {
    if (pending?.checkoutUrl)
      void navigator.clipboard?.writeText(pending.checkoutUrl);
    setNotice("Đã sao chép link thanh toán.");
  };

  if (plansQuery.isLoading || stateQuery.isLoading)
    return (
      <SimplePage
        active="home"
        eyebrow="KẾ HOẠCH TIẾT KIỆM"
        title="Đang tải kế hoạch"
        subtitle="Đang lấy dữ liệu từ backend."
      >
        <div className="empty">Đang tải…</div>
      </SimplePage>
    );
  if (!plan || !state)
    return (
      <SimplePage
        active="home"
        eyebrow="KẾ HOẠCH TIẾT KIỆM"
        title="Chưa có kế hoạch"
        subtitle="Tạo kế hoạch đầu tiên để bắt đầu."
      >
        <div className="empty">
          <strong>Bạn chưa có kế hoạch nào.</strong>
          <Link
            className="button primary"
            href="/plan/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              marginTop: 14,
              textDecoration: "none",
            }}
          >
            Tạo kế hoạch
          </Link>
        </div>
      </SimplePage>
    );

  return (
    <SimplePage
      active="home"
      eyebrow={`NGÀY TIẾT KIỆM ${state.plan.currentDayIndex} / ${state.plan.durationDays}`}
      title={state.plan.name}
      subtitle="Chọn khoản tiền, thanh toán và chờ backend xác minh."
    >
      <div className="plan-overview">
        <div>
          <span>Đã tiết kiệm</span>
          <strong>{money(state.plan.totalSavedAmount)}</strong>
        </div>
        <div>
          <span>Còn lại</span>
          <strong>{money(state.plan.remainingAmount)}</strong>
        </div>
      </div>
      <div className="plan-progress">
        <div className="progress-label">
          <span>
            {state.plan.completedDays} / {state.plan.durationDays} ngày hoàn
            thành
          </span>
          <strong>
            {Math.round(
              (state.plan.completedDays / state.plan.durationDays) * 100,
            )}
            %
          </strong>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${(state.plan.completedDays / state.plan.durationDays) * 100}%`,
            }}
          />
        </div>
      </div>
      {pending && (
        <div className="today-card">
          <div className="today-icon">
            <QrCode size={20} />
          </div>
          <div>
            <strong>Đang chờ thanh toán</strong>
            <span>
              {money(pending.amount)} · {pending.status}
            </span>
          </div>
        </div>
      )}
      <div className="slot-toolbar">
        <div className="tab-row">
          {(
            [
              { id: "AVAILABLE", label: "Còn lại" },
              { id: "PAID", label: "Đã thanh toán" },
              { id: "RESERVED", label: "Đang chờ" },
              { id: "ALL", label: "Tất cả" },
            ] as const
          ).map((item) => (
            <button
              className={tab === item.id ? "selected" : ""}
              onClick={() => setTab(item.id)}
              key={item.id}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="slot-filters">
          <span>↕</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as "asc" | "desc")}
            aria-label="Sắp xếp slot"
          >
            <option value="asc">Tăng dần</option>
            <option value="desc">Giảm dần</option>
          </select>
        </div>
      </div>
      <div className="slot-grid">
        {slots.map((slot) => (
          <button
            className={`slot-card ${slot.status.toLowerCase()}`}
            disabled={slot.status !== "AVAILABLE"}
            onClick={() => setSelected(slot)}
            key={slot.id}
          >
            <small>Slot {slot.slotIndex}</small>
            <strong>{money(slot.amount)}</strong>
            {slot.status === "AVAILABLE" && <span>Chọn khoản</span>}
            {slot.status === "RESERVED" && (
              <span>
                <Clock3 size={12} /> Đang chờ
              </span>
            )}
            {slot.status === "PAID" && (
              <span>
                <Check size={12} /> Đã trả
              </span>
            )}
          </button>
        ))}
      </div>
      {notice && (
        <div className="notice-card" role="status">
          {notice}
        </div>
      )}
      {selected && (
        <div
          className="sheet-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <section className="sheet" role="dialog" aria-modal="true">
            <div className="drag" />
            <div className="hero-row">
              <div>
                <p className="eyebrow" style={{ color: "#6c63d9" }}>
                  SLOT {selected.slotIndex}
                </p>
                <h2>Chọn {money(selected.amount)}?</h2>
              </div>
              <button
                className="icon-button"
                style={{
                  color: "#121237",
                  borderColor: "#dddde8",
                  background: "#fff",
                }}
                onClick={() => setSelected(null)}
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>
            <p>
              Slot chuyển sang RESERVED khi backend tạo payment. Chưa thanh toán
              thì chưa tăng ngày.
            </p>
            <button className="button primary" onClick={createPayment}>
              Tạo QR payOS <QrCode size={17} />
            </button>
          </section>
        </div>
      )}
      {pending && (
        <div className="sheet-backdrop" role="presentation">
          <section
            className="sheet payment-sheet"
            role="dialog"
            aria-modal="true"
          >
            <div className="drag" />
            <div className="payment-status-pill">
              <span className="pulse-dot" /> {pending.status}
            </div>
            <h2>Thanh toán khoản tiết kiệm</h2>
            <p>
              Ngày {pending.dayIndex}/{state.plan.durationDays} · Chuyển đúng số
              tiền hiển thị.
            </p>
            <div className="qr-wrap">
              <QRCodeSVG
                value={
                  pending.qrCode ?? pending.checkoutUrl ?? pending.description
                }
                size={190}
                includeMargin
              />
            </div>
            <div className="sheet-amount">{money(pending.amount)}</div>
            <p className="qr-help">
              Webhook/reconcile backend mới có thể xác nhận thành công.
            </p>
            <div className="payment-actions">
              <button className="button secondary" onClick={copyCheckout}>
                <Copy size={16} /> Link
              </button>
              <button className="button secondary" onClick={reconcile}>
                <RefreshCw size={16} /> Kiểm tra
              </button>
            </div>
            <button className="cancel-link" onClick={cancel}>
              Hủy payment
            </button>
          </section>
        </div>
      )}
    </SimplePage>
  );
}
