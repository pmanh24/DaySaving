"use client";

import { FormEvent, useEffect, useState } from "react";
import { LockKeyhole, LogIn, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, register } = useAuth();
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

  return <main className="auth-shell"><section className="auth-card"><div className="auth-brand"><div className="auth-brand-icon"><UserRound size={22} /></div><p className="eyebrow">100 DAYS SAVING</p><h1>{registerMode ? "Tạo tài khoản" : "Chào mừng trở lại"}</h1><p>{registerMode ? "Bắt đầu một kế hoạch tiết kiệm vừa sức." : "Đăng nhập để tiếp tục kế hoạch của bạn."}</p></div><form onSubmit={submit}><label className="field-label">Email<input className="pill-input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>{registerMode && <label className="field-label">Tên hiển thị<input className="pill-input" autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required /></label>}<label className="field-label">Mật khẩu<input className="pill-input" type="password" autoComplete={registerMode ? "new-password" : "current-password"} minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error && <div className="form-error" role="alert">{error}</div>}<button className="button primary auth-submit" type="submit" disabled={submitting}>{submitting ? "Đang xử lý…" : registerMode ? "Đăng ký" : "Đăng nhập"}<LogIn size={17} /></button></form><button className="auth-switch" type="button" onClick={() => { setRegisterMode((value) => !value); setError(""); }}>{registerMode ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}</button><p className="auth-note"><LockKeyhole size={13} /> Phiên đăng nhập được bảo vệ bằng cookie bảo mật.</p></section></main>;
}
