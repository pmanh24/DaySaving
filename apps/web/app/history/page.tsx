"use client";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { SimplePage } from "@/components/simple-page";
import { money } from "@/lib/format";
import { getDemoBoard } from "@/lib/demo-store";
import type { BoardCell } from "@saving/shared";
export default function HistoryPage() {
  const board = getDemoBoard();
  const completed = board.cells
    .filter((cell: BoardCell) => cell.status === "COMPLETED")
    .slice()
    .reverse();
  return (
    <SimplePage
      active="history"
      eyebrow="NHẬT KÝ TIẾT KIỆM"
      title="Lịch sử"
      subtitle="Mỗi khoản nhỏ đều là một bước tiến."
    >
      <div className="section-row" style={{ marginTop: 4 }}>
        <div>
          <h2 className="section-title">Tất cả giao dịch</h2>
          <p className="section-caption">
            {completed.length} khoản đã ghi nhận
          </p>
        </div>
        <select
          className="filter-select"
          aria-label="Bộ lọc lịch sử"
          defaultValue="all"
        >
          <option value="all">Tất cả</option>
          <option value="7">7 ngày</option>
          <option value="30">30 ngày</option>
        </select>
      </div>
      <div className="recent-list" style={{ marginTop: 18 }}>
        {completed.length ? (
          completed.map((cell: BoardCell) => (
            <div className="recent-item" key={cell.number}>
              <div className="recent-icon">
                <CheckCircle2 size={18} />
              </div>
              <div className="recent-main">
                <strong>Ô số {cell.number}</strong>
                <span>{cell.completedDate ?? "Hôm nay"} · Hoàn thành</span>
              </div>
              <span className="recent-amount">+{money(cell.amount)}</span>
            </div>
          ))
        ) : (
          <div className="empty">
            <RotateCcw size={24} />
            <strong>Chưa có khoản tiết kiệm nào</strong>
            <span>Hãy chọn một ô trên bảng để bắt đầu.</span>
          </div>
        )}
      </div>
    </SimplePage>
  );
}
