"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Dice5,
  History,
  PiggyBank,
  WalletCards,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type {
  BoardCell,
  BoardResponse,
  ChallengePayment,
  Checkin,
} from "@saving/shared";
import { BottomNav } from "@/components/bottom-nav";
import { ChallengePaymentSheet } from "@/components/challenge-payment-sheet";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { SavingBoard } from "@/components/saving-board";
import { useAuth } from "@/components/auth-provider";
import { apiRequest } from "@/lib/api";
import { compactMoney, money } from "@/lib/format";
import { useSavingUi } from "@/stores/use-saving-ui";

async function getBoard(accessToken: string): Promise<BoardResponse> {
  return apiRequest<BoardResponse>("/challenges/current", {}, accessToken);
}

export default function HomePage() {
  const { accessToken, user } = useAuth();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["challenges", "current", accessToken],
    queryFn: () => getBoard(accessToken!),
    enabled: Boolean(accessToken),
  });
  const [localBoard, setLocalBoard] = useState<BoardResponse>();
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<ChallengePayment | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    checkin?: Checkin;
  } | null>(null);
  const selectedNumber = useSavingUi((state) => state.selectedNumber);
  const suggestedNumber = useSavingUi((state) => state.suggestedNumber);
  const sheetOpen = useSavingUi((state) => state.sheetOpen);
  const setSelectedNumber = useSavingUi((state) => state.setSelectedNumber);
  const setSuggestedNumber = useSavingUi((state) => state.setSuggestedNumber);
  const setSheetOpen = useSavingUi((state) => state.setSheetOpen);
  const current = localBoard ?? data;
  const selected =
    current?.cells.find((cell) => cell.number === selectedNumber) ?? null;
  const recent = useMemo(
    () =>
      current?.cells
        .filter((cell) => cell.status === "COMPLETED")
        .slice(-3)
        .reverse() ?? [],
    [current],
  );

  const clearSelection = () => {
    setSheetOpen(false);
    setSelectedNumber(null);
    setSuggestedNumber(null);
  };

  const choose = (cell: BoardCell) => {
    setSelectedNumber(cell.number);
    setSheetOpen(true);
  };
  const chooseRandom = () => {
    const available =
      current?.cells.filter((cell) => cell.status !== "COMPLETED") ?? [];
    const pick = available[Math.floor(Math.random() * available.length)];
    if (pick) {
      setSuggestedNumber(pick.number);
      choose(pick);
    }
  };

  const confirmCash = () => {
    if (!current || !selected || !accessToken) return;
    setLoading(true);
    void apiRequest<BoardResponse>(
      `/challenges/${current.challenge.id}/checkins/manual`,
      {
        method: "POST",
        body: JSON.stringify({
          number: selected.number,
          idempotencyKey: crypto.randomUUID(),
        }),
      },
      accessToken,
    )
      .then((next) => {
        setLocalBoard(next);
        setToast({
          message: `Đã tick tự tiết kiệm ${money(selected.amount)}`,
          checkin: next.today.checkin ?? undefined,
        });
        clearSelection();
      })
      .catch((error: unknown) =>
        setToast({
          message:
            error instanceof Error
              ? error.message
              : "Không thể lưu khoản tiết kiệm",
        }),
      )
      .finally(() => setLoading(false));
  };

  const createPayosPayment = () => {
    if (!current || !selected || !accessToken) return;
    setPaymentLoading(true);
    void apiRequest<ChallengePayment>(
      `/challenges/${current.challenge.id}/payments`,
      {
        method: "POST",
        body: JSON.stringify({
          number: selected.number,
          idempotencyKey: crypto.randomUUID(),
        }),
      },
      accessToken,
    )
      .then((created) => {
        setPayment(created);
        setSheetOpen(false);
        setToast({ message: "Đã tạo QR payOS. Quét mã để gửi tiền vào quỹ." });
      })
      .catch((error: unknown) =>
        setToast({
          message:
            error instanceof Error ? error.message : "Không thể tạo QR payOS",
        }),
      )
      .finally(() => setPaymentLoading(false));
  };

  const reconcilePayosPayment = () => {
    if (!payment || !accessToken) return;
    setPaymentLoading(true);
    void apiRequest<ChallengePayment>(
      `/challenge-payments/${payment.id}/reconcile`,
      { method: "POST" },
      accessToken,
    )
      .then(async (nextPayment) => {
        if (nextPayment.status === "PAID") {
          const refreshed = await refetch();
          if (refreshed.data) setLocalBoard(refreshed.data);
          setToast({
            message: `Đã nhận thanh toán ${money(nextPayment.amount)} cho ô số ${nextPayment.number}.`,
          });
          setPayment(null);
          clearSelection();
        } else {
          setPayment(nextPayment);
          setToast({
            message: `Payment đang ở trạng thái ${nextPayment.status}.`,
          });
        }
      })
      .catch((error: unknown) =>
        setToast({
          message:
            error instanceof Error
              ? error.message
              : "Không thể kiểm tra thanh toán",
        }),
      )
      .finally(() => setPaymentLoading(false));
  };

  const cancelPayosPayment = () => {
    if (!payment || !accessToken) return;
    setPaymentLoading(true);
    void apiRequest<ChallengePayment>(
      `/challenge-payments/${payment.id}/cancel`,
      { method: "POST" },
      accessToken,
    )
      .then(() => {
        setPayment(null);
        clearSelection();
        setToast({ message: "Đã hủy payment." });
      })
      .catch((error: unknown) =>
        setToast({
          message:
            error instanceof Error ? error.message : "Không thể hủy payment",
        }),
      )
      .finally(() => setPaymentLoading(false));
  };

  const undo = () => {
    if (!toast?.checkin || !accessToken) return;
    void apiRequest<BoardResponse>(
      `/challenges/checkins/${toast.checkin.id}/reverse`,
      { method: "POST" },
      accessToken,
    )
      .then((next) => {
        setLocalBoard(next);
        setToast({ message: "Đã hoàn tác khoản tiết kiệm" });
      })
      .catch((error: unknown) =>
        setToast({
          message:
            error instanceof Error ? error.message : "Không thể hoàn tác",
        }),
      );
  };

  if (isLoading && !current)
    return (
      <main className="app-shell">
        <div className="navy-hero" />
        <div className="page-content">
          <div className="progress-card" style={{ height: 120 }} />
          <div className="board-card" style={{ height: 330 }} />
        </div>
      </main>
    );
  if (isError && !current)
    return (
      <main className="app-shell">
        <div className="navy-hero" />
        <div className="page-content">
          <div className="empty">
            <strong>Không thể tải dữ liệu</strong>
            <p>Vui lòng thử lại.</p>
            <button className="button primary" onClick={() => void refetch()}>
              Thử lại
            </button>
          </div>
        </div>
      </main>
    );
  if (!current) return null;

  const { challenge } = current;
  return (
    <main className="app-shell">
      <header className="navy-hero">
        <div className="content-width">
          <div className="hero-row">
            <div>
              <p className="eyebrow">100 DAYS SAVING</p>
              <h1 className="hero-title">
                Chào mừng bạn, {user?.displayName ?? "bạn"}
              </h1>
              <p className="hero-subtitle">
                Mỗi ngày một bước nhỏ, gần hơn với mục tiêu.
              </p>
            </div>
          </div>
          <p className="eyebrow" style={{ marginTop: 22 }}>
            ĐÃ TIẾT KIỆM
          </p>
          <div className="hero-amount">{money(challenge.savedAmount)}</div>
        </div>
      </header>
      <div className="page-content">
        <div className="content-width">
          <section className="progress-card" style={{ marginTop: -1 }}>
            <div className="progress-label">
              <span>
                <strong>{challenge.completedCells}</strong> / 100 ô
              </span>
              <strong>{challenge.progressPercent}%</strong>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(challenge.progressPercent, 100)}%`,
                }}
              />
            </div>
            <div className="metric-grid">
              <div className="metric">
                <strong>{money(challenge.remainingAmount)}</strong>
                <span>Còn lại</span>
              </div>
              <div className="metric">
                <strong>{challenge.streak} ngày</strong>
                <span>Chuỗi hiện tại</span>
              </div>
              <div className="metric">
                <strong>
                  {current.today.checked ? "Đã xong" : "Chưa xong"}
                </strong>
                <span>Hôm nay</span>
              </div>
            </div>
          </section>
          <section className="section">
            <h2 className="section-title">Bắt đầu thật nhẹ nhàng</h2>
            <p className="section-caption">Một lựa chọn tốt hơn cho hôm nay.</p>
            <div className="quick-actions">
              <button
                className="quick-action"
                onClick={() => {
                  const next = current.cells.find(
                    (cell) => cell.status !== "COMPLETED",
                  );
                  if (next) choose(next);
                }}
              >
                <PiggyBank size={18} />
                <span>Tiết kiệm hôm nay</span>
              </button>
              <button className="quick-action" onClick={chooseRandom}>
                <Dice5 size={18} />
                <span>Chọn ngẫu nhiên</span>
              </button>
              <button
                className="quick-action"
                onClick={() => window.location.assign("/history")}
              >
                <History size={18} />
                <span>Xem lịch sử</span>
              </button>
            </div>
          </section>
          <section className="section">
            <SavingBoard
              cells={current.cells}
              suggestedNumber={suggestedNumber}
              onSelect={choose}
            />
          </section>
          <section className="section">
            <div className="section-row">
              <div>
                <h2 className="section-title">Giao dịch gần nhất</h2>
                <p className="section-caption">
                  Những bước tiến mới nhất của bạn
                </p>
              </div>
              <button
                className="icon-button"
                style={{ color: "#111", border: 0, background: "transparent" }}
                onClick={() => window.location.assign("/history")}
                aria-label="Xem tất cả"
              >
                <ArrowRight size={18} />
              </button>
            </div>
            <div className="recent-list">
              {recent.length ? (
                recent.map((cell) => (
                  <div className="recent-item" key={cell.number}>
                    <div className="recent-icon">
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="recent-main">
                      <strong>Ô số {cell.number}</strong>
                      <span>
                        {cell.completedDate
                          ? `Đã hoàn thành ngày ${cell.completedDate}`
                          : "Vừa xong"}
                      </span>
                    </div>
                    <span className="recent-amount">+{money(cell.amount)}</span>
                  </div>
                ))
              ) : (
                <div className="empty">
                  <WalletCards size={24} />
                  <strong>Chưa có khoản tiết kiệm nào</strong>
                  <span>Hãy chọn một ô trên bảng để bắt đầu.</span>
                </div>
              )}
            </div>
          </section>
          <p
            style={{
              textAlign: "center",
              color: "#777",
              fontSize: 10,
              margin: "28px 0 0",
            }}
          >
            Mục tiêu: {compactMoney(challenge.targetAmount)} · Không giữ tiền
            trực tiếp
          </p>
        </div>
      </div>
      <BottomNav active="home" />
      {sheetOpen && selected && (
        <ConfirmSheet
          number={selected.number}
          amount={selected.amount}
          total={challenge.savedAmount}
          onClose={clearSelection}
          onCashConfirm={confirmCash}
          onPayosConfirm={createPayosPayment}
          loading={loading || paymentLoading}
        />
      )}
      {payment && (
        <ChallengePaymentSheet
          payment={payment}
          onClose={() => {
            if (!paymentLoading) {
              setPayment(null);
              clearSelection();
            }
          }}
          onReconcile={reconcilePayosPayment}
          onCancel={cancelPayosPayment}
          loading={paymentLoading}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          <span style={{ flex: 1 }}>{toast.message}</span>
          {toast.checkin && (
            <button
              style={{
                border: 0,
                background: "transparent",
                color: "#aaa",
                fontSize: 11,
                fontWeight: 800,
              }}
              onClick={undo}
            >
              Hoàn tác
            </button>
          )}
          <button
            style={{ border: 0, background: "transparent", color: "#fff" }}
            onClick={() => setToast(null)}
            aria-label="Đóng thông báo"
          >
            ×
          </button>
        </div>
      )}
    </main>
  );
}
