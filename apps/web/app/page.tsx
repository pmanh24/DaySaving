"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Dice5, History, MoreHorizontal, PiggyBank, WalletCards } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { BoardCell, BoardResponse, Checkin } from "@saving/shared";
import { BottomNav } from "@/components/bottom-nav";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { SavingBoard } from "@/components/saving-board";
import { compactMoney, money } from "@/lib/format";
import { demoCheckin, demoReverse, getDemoBoard, setDemoBoard } from "@/lib/demo-store";
import { useSavingUi } from "@/stores/use-saving-ui";

async function getBoard(): Promise<BoardResponse> {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "false") return getDemoBoard();
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/challenges/current`, { credentials: "include" });
  if (!response.ok) throw new Error("Không thể tải dữ liệu");
  return (await response.json() as { data: BoardResponse }).data;
}

export default function HomePage() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["challenges", "current"], queryFn: getBoard });
  const [localBoard, setLocalBoard] = useState<BoardResponse>();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; checkin?: Checkin } | null>(null);
  const selectedNumber = useSavingUi((state) => state.selectedNumber);
  const suggestedNumber = useSavingUi((state) => state.suggestedNumber);
  const sheetOpen = useSavingUi((state) => state.sheetOpen);
  const setSelectedNumber = useSavingUi((state) => state.setSelectedNumber);
  const setSuggestedNumber = useSavingUi((state) => state.setSuggestedNumber);
  const setSheetOpen = useSavingUi((state) => state.setSheetOpen);
  const current = localBoard ?? data;
  const selected = current?.cells.find((cell) => cell.number === selectedNumber) ?? null;
  const recent = useMemo(() => current?.cells.filter((cell) => cell.status === "COMPLETED").slice(-3).reverse() ?? [], [current]);

  const choose = (cell: BoardCell) => {
    setSelectedNumber(cell.number);
    setSheetOpen(true);
  };

  const chooseRandom = () => {
    if (!current) return;
    const available = current.cells.filter((cell) => cell.status !== "COMPLETED");
    const pick = available[Math.floor(Math.random() * available.length)];
    if (pick) {
      setSuggestedNumber(pick.number);
      choose(pick);
    }
  };

  const confirm = () => {
    if (!current || !selected) return;
    setLoading(true);
    window.setTimeout(() => {
      try {
        const result = demoCheckin(current, selected.number);
        setLocalBoard(result.board);
        setDemoBoard(result.board);
        setToast({ message: `Đã tiết kiệm ${money(result.checkin.amount)}`, checkin: result.checkin });
        setSheetOpen(false);
        setSelectedNumber(null);
        setSuggestedNumber(null);
      } catch (error) {
        setToast({ message: error instanceof Error ? error.message : "Không thể lưu khoản tiết kiệm" });
      } finally {
        setLoading(false);
      }
    }, 420);
  };

  const undo = () => {
    if (!current || !toast?.checkin) return;
    const next = demoReverse(current, toast.checkin);
    setLocalBoard(next);
    setDemoBoard(next);
    setToast({ message: "Đã hoàn tác khoản tiết kiệm" });
  };

  if (isLoading && !current) return <main className="app-shell"><div className="navy-hero" /><div className="page-content"><div className="progress-card" style={{ height: 120 }} /><div className="board-card" style={{ height: 330 }} /></div></main>;
  if (isError && !current) return <main className="app-shell"><div className="navy-hero" /><div className="page-content"><div className="empty"><strong>Không thể tải dữ liệu</strong><p>Vui lòng thử lại.</p><button className="button primary" onClick={() => void refetch()}>Thử lại</button></div></div></main>;
  if (!current) return null;

  const { challenge } = current;
  return (
    <main className="app-shell">
      <header className="navy-hero">
        <div className="content-width">
          <div className="hero-row">
            <div><p className="eyebrow">100 DAYS SAVING</p><h1 className="hero-title">Chào buổi sáng, Minh 👋</h1><p className="hero-subtitle">Mỗi ngày một bước nhỏ, gần hơn với mục tiêu.</p></div>
            <button className="icon-button" aria-label="Mở thêm tùy chọn"><MoreHorizontal size={20} /></button>
          </div>
          <p className="eyebrow" style={{ marginTop: 22 }}>ĐÃ TIẾT KIỆM</p>
          <div className="hero-amount">{money(challenge.savedAmount)}</div>
        </div>
      </header>

      <div className="page-content"><div className="content-width">
        <section className="progress-card" style={{ marginTop: -1 }}>
          <div className="progress-label"><span><strong>{challenge.completedCells}</strong> / 100 ô</span><strong>{challenge.progressPercent}%</strong></div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(challenge.progressPercent, 100)}%` }} /></div>
          <div className="metric-grid"><div className="metric"><strong>{money(challenge.remainingAmount)}</strong><span>Còn lại</span></div><div className="metric"><strong>{challenge.streak} ngày</strong><span>Chuỗi hiện tại</span></div><div className="metric"><strong>{current.today.checked ? "Đã xong" : "Chưa xong"}</strong><span>Hôm nay</span></div></div>
        </section>

        <section className="section"><h2 className="section-title">Bắt đầu thật nhẹ nhàng</h2><p className="section-caption">Một lựa chọn tốt hơn cho hôm nay.</p>
          <div className="quick-actions"><button className="quick-action" onClick={() => { const next = current.cells.find((cell) => cell.status !== "COMPLETED"); if (next) choose(next); }}><PiggyBank size={18} /><span>Tiết kiệm hôm nay</span></button><button className="quick-action" onClick={chooseRandom}><Dice5 size={18} /><span>Chọn ngẫu nhiên</span></button><button className="quick-action" onClick={() => window.alert("Lịch sử sẽ được mở ở phiên bản tiếp theo")}><History size={18} /><span>Xem lịch sử</span></button></div>
        </section>

        <section className="section"><SavingBoard cells={current.cells} suggestedNumber={suggestedNumber} onSelect={choose} /></section>

        <section className="section"><div className="section-row"><div><h2 className="section-title">Giao dịch gần nhất</h2><p className="section-caption">Những bước tiến mới nhất của bạn</p></div><button className="icon-button" style={{ color: "#4c40ff", border: 0, background: "transparent" }} aria-label="Xem tất cả"><ArrowRight size={18} /></button></div>
          <div className="recent-list">{recent.length ? recent.map((cell) => <div className="recent-item" key={cell.number}><div className="recent-icon"><CheckCircle2 size={18} /></div><div className="recent-main"><strong>Ô số {cell.number}</strong><span>{cell.completedDate ? `Đã hoàn thành ngày ${cell.completedDate}` : "Vừa xong"}</span></div><span className="recent-amount">+{money(cell.amount)}</span></div>) : <div className="empty"><WalletCards size={24} /><strong>Chưa có khoản tiết kiệm nào</strong><span>Hãy chọn một ô trên bảng để bắt đầu.</span></div>}</div>
        </section>
        <p style={{ textAlign: "center", color: "#a1a1b4", fontSize: 10, margin: "28px 0 0" }}>Mục tiêu: {money(challenge.targetAmount)} · Không giữ tiền trực tiếp</p>
      </div></div>

      <BottomNav active="home" />
      {sheetOpen && selected && <ConfirmSheet number={selected.number} amount={selected.amount} total={challenge.savedAmount} onClose={() => { if (!loading) { setSheetOpen(false); setSelectedNumber(null); setSuggestedNumber(null); } }} onConfirm={confirm} loading={loading} />}
      {toast && <div className="toast" role="status"><CheckCircle2 size={18} /><span style={{ flex: 1 }}>{toast.message}</span>{toast.checkin && <button style={{ border: 0, background: "transparent", color: "#bdbdff", fontSize: 11, fontWeight: 800 }} onClick={undo}>Hoàn tác</button>}<button style={{ border: 0, background: "transparent", color: "#fff" }} onClick={() => setToast(null)} aria-label="Đóng thông báo">×</button></div>}
    </main>
  );
}
