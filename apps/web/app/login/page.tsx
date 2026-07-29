"use client";

import { FormEvent, useEffect, useState } from "react";
import { LockKeyhole, LogIn, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { user, isDemoMode, login, register } = useAuth();
  const [registerMode, setRegisterMode] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (user) router.replace("/"); }, [router, user]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (registerMode) await register(email, displayName, password);
      else await login(email, password);
      router.replace("/");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Không thể đăng nhập.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isDemoMode) return <main className="auth-loading"><div className="auth-card"><strong>Demo mode đang bật</strong><span>Đổi NEXT_PUBLIC_DEMO_MODE=false để dùng đăng nhập backend.</span></div></main>;

  return <main className="auth-shell"><section className="auth-card"><div className="auth-brand"><div className="auth-brand-icon"><LockKeyhole size={22}/></div><p className="eyebrow">100 DAYS SAVING</p><h1>{registerMode ? "Tạo tài khoản" : "Chào mừng trở lại"}</h1><p>{registerMode ? "Bắt đầu theo dõi kế hoạch tiết kiệm của bạn." : "Đăng nhập để tiếp tục kế hoạch của bạn."}</p></div><form onSubmit={submit}><label className="field-label">Email<input className="pill-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>{registerMode && <label className="field-label">Tên hiển thị<input className="pill-input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required minLength={2} autoComplete="name" /></label>}<label className="field-label">Mật khẩu<input className="pill-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete={registerMode ? "new-password" : "current-password"} /></label>{registerMode && <p className="field-help">Mật khẩu cần ít nhất 8 ký tự, gồm chữ và số.</p>}{error && <div className="form-error" role="alert">{error}</div>}<button className="button primary auth-submit" disabled={submitting}>{registerMode ? <UserRound size={17}/> : <LogIn size={17}/>} {submitting ? "Đang xử lý…" : registerMode ? "Đăng ký" : "Đăng nhập"}</button></form><button className="auth-switch" onClick={() => { setRegisterMode((current) => !current); setError(""); }}>{registerMode ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}</button></section></main>;
}
