"use client";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";
export function SimplePage({ active, eyebrow, title, subtitle, children }: { active:string; eyebrow:string; title:string; subtitle:string; children:React.ReactNode }) { return <main className="app-shell"><header className="navy-hero"><div className="content-width"><div className="hero-row"><div><p className="eyebrow">{eyebrow}</p><h1 className="hero-title">{title}</h1><p className="hero-subtitle">{subtitle}</p></div><Link className="icon-button" href="/" aria-label="Về trang chủ">{active === "home" ? <MoreHorizontal size={20}/> : <ArrowLeft size={20}/>}</Link></div></div></header><div className="page-content"><div className="content-width">{children}</div></div><BottomNav active={active}/></main>; }
