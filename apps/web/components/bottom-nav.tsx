"use client";
import {
  BarChart3,
  Grid3X3,
  History,
  UserRound,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
export function BottomNav({ active = "home" }: { active?: string }) {
  const items = [
    { id: "home", label: "Bảng ô", icon: Grid3X3, href: "/" },
    { id: "plan", label: "Kế hoạch", icon: WalletCards, href: "/plan" },
    { id: "history", label: "Lịch sử", icon: History, href: "/history" },
    { id: "stats", label: "Thống kê", icon: BarChart3, href: "/stats" },
    { id: "profile", label: "Cá nhân", icon: UserRound, href: "/profile" },
  ];
  return (
    <nav className="bottom-nav" aria-label="Điều hướng chính">
      {items.map(({ id, label, icon: Icon, href }) => (
        <Link
          className={`nav-item ${active === id ? "active" : ""}`}
          key={id}
          href={href}
        >
          <Icon />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
