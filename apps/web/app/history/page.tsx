"use client";

import { CheckCircle2, RotateCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SimplePage } from "@/components/simple-page";
import { useAuth } from "@/components/auth-provider";
import { apiRequest, isDemoMode } from "@/lib/api";
import { money } from "@/lib/format";
import { getDemoBoard } from "@/lib/demo-store";
import type { BoardResponse, Checkin } from "@saving/shared";

async function loadHistory(accessToken: string | null): Promise<Checkin[]> {
  if (isDemoMode) return getDemoBoard().cells.filter((cell) => cell.status === "COMPLETED").map((cell) => ({ id: `demo-${cell.number}`, number: cell.number, amount: cell.amount, localDate: cell.completedDate ?? "", status: "COMPLETED" as const, createdAt: cell.completedDate ?? "" }));
  const board = await apiRequest<BoardResponse>("/challenges/current", {}, accessToken ?? undefined);
  return apiRequest<Checkin[]>(`/challenges/${board.challenge.id}/history`, {}, accessToken ?? undefined);
}

export default function HistoryPage() {
  const { accessToken } = useAuth();
  const { data: history = [], isLoading } = useQuery({ queryKey: ["history", accessToken], queryFn: () => loadHistory(accessToken), enabled: isDemoMode || Boolean(accessToken) });
  const completed = history.filter((item) => item.status === "COMPLETED").sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return <SimplePage active="history" eyebrow="NHẬT KÝ TIẾT KIỆM" title="Lịch sử" subtitle="Mỗi khoản nhỏ đều là một bước tiến."><div className="section-row" style={{ marginTop: 4 }}><div><h2 className="section-title">Tất cả giao dịch</h2><p className="section-caption">{isLoading ? "Đang tải…" : `${completed.length} khoản đã ghi nhận`}</p></div><select className="filter-select" aria-label="Bộ lọc lịch sử" defaultValue="all"><option value="all">Tất cả</option><option value="7">7 ngày</option><option value="30">30 ngày</option></select></div><div className="recent-list" style={{ marginTop: 18 }}>{completed.length ? completed.map((item) => <div className="recent-item" key={item.id}><div className="recent-icon"><CheckCircle2 size={18}/></div><div className="recent-main"><strong>Ô số {item.number}</strong><span>{item.localDate || "Hôm nay"} · Hoàn thành</span></div><span className="recent-amount">+{money(item.amount)}</span></div>) : <div className="empty"><RotateCcw size={24}/><strong>{isLoading ? "Đang tải lịch sử" : "Chưa có khoản tiết kiệm nào"}</strong><span>Hãy chọn một ô trên bảng để bắt đầu.</span></div>}</div></SimplePage>;
}
