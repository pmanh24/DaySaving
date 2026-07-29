"use client";

import { ChartNoAxesCombined, Flame, Target, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SimplePage } from "@/components/simple-page";
import { useAuth } from "@/components/auth-provider";
import { apiRequest } from "@/lib/api";
import { money } from "@/lib/format";
import type { BoardResponse } from "@saving/shared";

interface Statistics { totalSaved: number; targetAmount: number; progressPercent: number; completedCells: number; remainingCells: number; averagePerDay: number; currentStreak: number; }

async function loadStatistics(accessToken: string): Promise<Statistics> {
  const board = await apiRequest<BoardResponse>("/challenges/current", {}, accessToken);
  return apiRequest<Statistics>(`/challenges/${board.challenge.id}/statistics`, {}, accessToken);
}

export default function StatsPage() {
  const { accessToken } = useAuth();
  const { data: stats, isLoading } = useQuery({ queryKey: ["statistics", accessToken], queryFn: () => loadStatistics(accessToken!), enabled: Boolean(accessToken) });
  if (!stats) return <SimplePage active="stats" eyebrow="GÓC NHÌN CỦA BẠN" title="Thống kê" subtitle="Nhìn lại nhịp tiết kiệm đang hình thành."><div className="empty">{isLoading ? "Đang tải dữ liệu…" : "Chưa có dữ liệu thống kê."}</div></SimplePage>;
  return <SimplePage active="stats" eyebrow="GÓC NHÌN CỦA BẠN" title="Thống kê" subtitle="Nhìn lại nhịp tiết kiệm đang hình thành."><div className="stat-hero-card"><div className="stat-icon"><ChartNoAxesCombined size={22}/></div><span>Tổng đã tiết kiệm</span><strong>{money(stats.totalSaved)}</strong><div className="progress-track"><div className="progress-fill" style={{width:`${stats.progressPercent}%`}}/></div><small>{stats.progressPercent}% mục tiêu</small></div><div className="stats-grid"><div className="stat-card"><TrendingUp size={18}/><span>Trung bình mỗi ngày</span><strong>{money(stats.averagePerDay)}</strong></div><div className="stat-card"><Target size={18}/><span>Còn lại</span><strong>{stats.remainingCells} ô</strong></div><div className="stat-card"><Flame size={18}/><span>Chuỗi hiện tại</span><strong>{stats.currentStreak} ngày</strong></div><div className="stat-card"><ChartNoAxesCombined size={18}/><span>Mục tiêu</span><strong>{money(stats.targetAmount)}</strong></div></div><div className="insight-card"><strong>Đang đi đúng hướng</strong><p>Mỗi ngày chỉ cần hoàn thành một ô. Bạn không cần hoàn hảo, chỉ cần tiếp tục.</p></div></SimplePage>;
}
