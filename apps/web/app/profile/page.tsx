"use client";

import { Bell, LogOut, Moon, ShieldCheck, UserRound } from "lucide-react";
import { SimplePage } from "@/components/simple-page";
import { useAuth } from "@/components/auth-provider";

export default function ProfilePage() {
  const { user, logout, isDemoMode } = useAuth();
  return <SimplePage active="profile" eyebrow="KHÔNG GIAN CỦA BẠN" title="Cá nhân" subtitle="Thiết lập trải nghiệm theo cách bạn muốn."><div className="profile-card"><div className="avatar"><UserRound size={25}/></div><div><strong>{user?.displayName ?? "Minh Nguyễn"}</strong><span>{user?.email ?? "demo@example.com"}</span></div></div><div className="settings-list"><div className="setting-item"><div className="setting-icon"><Moon size={18}/></div><div><strong>Giao diện</strong><span>Hệ thống</span></div><span className="setting-value">›</span></div><div className="setting-item"><div className="setting-icon"><Bell size={18}/></div><div><strong>Nhắc nhở</strong><span>Bật thông báo tiết kiệm</span></div><span className="toggle on"/></div><div className="setting-item"><div className="setting-icon"><ShieldCheck size={18}/></div><div><strong>Riêng tư & bảo mật</strong><span>Dữ liệu của bạn được bảo vệ</span></div><span className="setting-value">›</span></div>{!isDemoMode && <button className="setting-item setting-button" onClick={() => void logout()}><div className="setting-icon danger"><LogOut size={18}/></div><div><strong>Đăng xuất</strong><span>Kết thúc phiên hiện tại</span></div></button>}</div><p className="profile-note">100 Days Saving · MVP 0.1<br/>Ứng dụng chỉ theo dõi, không trực tiếp giữ tiền.</p></SimplePage>;
}
