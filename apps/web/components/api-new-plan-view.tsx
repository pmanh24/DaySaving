"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ListChecks, QrCode, Sparkles, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AmountGenerationMode, SavingPlan } from "@saving/shared";
import { useAuth } from "@/components/auth-provider";
import { SimplePage } from "@/components/simple-page";
import { apiRequest } from "@/lib/api";
import { money } from "@/lib/format";
import { autoAmounts, classicAmounts } from "@/lib/plan-demo";

const today = new Date().toISOString().slice(0, 10);

export function ApiNewPlanView() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [name, setName] = useState("Quỹ du lịch");
  const [durationDays, setDurationDays] = useState(30);
  const [generationMode, setGenerationMode] = useState<AmountGenerationMode>("CLASSIC_SEQUENCE");
  const [unitAmount, setUnitAmount] = useState(5000);
  const [targetAmount, setTargetAmount] = useState(10000000);
  const [minAmount, setMinAmount] = useState(20000);
  const [maxAmount, setMaxAmount] = useState(200000);
  const [stepAmount, setStepAmount] = useState(1000);
  const [customText, setCustomText] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [confirmationMode, setConfirmationMode] = useState<"PAYOS_ONLY" | "PAYOS_OR_MANUAL">("PAYOS_ONLY");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const customAmounts = customText.split(/[,\n]/).map((value) => Number(value.trim())).filter((value) => Number.isFinite(value));
  const amounts = useMemo(() => { if (generationMode === "CLASSIC_SEQUENCE") return classicAmounts(durationDays, unitAmount); if (generationMode === "CUSTOM_LIST") return customAmounts; return autoAmounts(durationDays, targetAmount, minAmount, maxAmount, stepAmount); }, [customText, durationDays, generationMode, maxAmount, minAmount, stepAmount, targetAmount, unitAmount]);

  const submit = () => {
    if (name.trim().length < 2 || durationDays < 1 || durationDays > 300 || !amounts.length || amounts.length !== durationDays) { setError("Vui lòng kiểm tra tên, số ngày và danh sách khoản tiền."); return; }
    setError("");
    setSaving(true);
    void apiRequest<{ plan: SavingPlan; slotCount: number }>("/saving-plans", { method: "POST", body: JSON.stringify({ name, durationDays, generationMode, unitAmount, targetAmount, minAmount, maxAmount, stepAmount, customAmounts, startDate, timezone: "Asia/Ho_Chi_Minh", progressMode: "FLEXIBLE_CONTRIBUTION_DAYS", confirmationMode, paymentDestinationMode: "SINGLE_OWNER_CHANNEL", paymentExpiresInMinutes: 15 }) }, accessToken ?? undefined)
      .then((result) => router.push(`/plan?planId=${result.plan.id}`))
      .catch((submissionError: unknown) => setError(submissionError instanceof Error ? submissionError.message : "Không thể tạo kế hoạch."))
      .finally(() => setSaving(false));
  };

  return <SimplePage active="home" eyebrow="KẾ HOẠCH MỚI" title="Tạo kế hoạch" subtitle="Dữ liệu sẽ được tạo qua backend và gắn với tài khoản của bạn."><section className="wizard-card"><div className="wizard-icon"><Target size={22}/></div><h2>Thông tin kế hoạch</h2><label className="field-label">Tên kế hoạch<input className="pill-input" value={name} onChange={(event) => setName(event.target.value)} /></label><label className="field-label">Số ngày<div className="preset-row">{[30, 100, 300].map((days) => <button type="button" className={`preset ${durationDays === days ? "selected" : ""}`} onClick={() => setDurationDays(days)} key={days}>{days} ngày</button>)}<input className="pill-input compact" type="number" min={1} max={300} value={durationDays} onChange={(event) => setDurationDays(Number(event.target.value))}/></div></label><label className="field-label">Ngày bắt đầu<input className="pill-input" type="date" min={today} value={startDate} onChange={(event) => setStartDate(event.target.value)}/></label></section><section className="wizard-card" style={{ marginTop: 12 }}><div className="wizard-icon"><ListChecks size={22}/></div><h2>Danh sách khoản tiền</h2><div className="mode-list"><button type="button" className={`mode-option ${generationMode === "CLASSIC_SEQUENCE" ? "selected" : ""}`} onClick={() => setGenerationMode("CLASSIC_SEQUENCE")}><ListChecks size={18}/><span><strong>Classic Sequence</strong><small>1U, 2U, 3U… theo số ngày</small></span></button><button type="button" className={`mode-option ${generationMode === "TARGET_AUTO_DISTRIBUTION" ? "selected" : ""}`} onClick={() => setGenerationMode("TARGET_AUTO_DISTRIBUTION")}><Sparkles size={18}/><span><strong>Phân bổ theo mục tiêu</strong><small>Backend chia đúng tổng mục tiêu</small></span></button><button type="button" className={`mode-option ${generationMode === "CUSTOM_LIST" ? "selected" : ""}`} onClick={() => setGenerationMode("CUSTOM_LIST")}><Target size={18}/><span><strong>Danh sách tùy chỉnh</strong><small>Nhập đủ một khoản cho mỗi ngày</small></span></button></div>{generationMode === "CLASSIC_SEQUENCE" && <label className="field-label">Đơn vị tiền<input className="pill-input" type="number" min={1} value={unitAmount} onChange={(event) => setUnitAmount(Number(event.target.value))}/></label>}{generationMode === "TARGET_AUTO_DISTRIBUTION" && <div className="two-fields"><label className="field-label">Mục tiêu<input className="pill-input" type="number" value={targetAmount} onChange={(event) => setTargetAmount(Number(event.target.value))}/></label><label className="field-label">Bước làm tròn<input className="pill-input" type="number" value={stepAmount} onChange={(event) => setStepAmount(Number(event.target.value))}/></label><label className="field-label">Thấp nhất<input className="pill-input" type="number" value={minAmount} onChange={(event) => setMinAmount(Number(event.target.value))}/></label><label className="field-label">Cao nhất<input className="pill-input" type="number" value={maxAmount} onChange={(event) => setMaxAmount(Number(event.target.value))}/></label></div>}{generationMode === "CUSTOM_LIST" && <label className="field-label">Danh sách khoản tiền<textarea className="custom-textarea" value={customText} onChange={(event) => setCustomText(event.target.value)} placeholder="1000\n5000\n10000"/></label>}<div className="preview-strip"><span>{amounts.length} khoản</span><strong>{money(amounts.reduce((sum, amount) => sum + amount, 0))}</strong></div></section><section className="wizard-card" style={{ marginTop: 12 }}><div className="wizard-icon"><QrCode size={22}/></div><h2>Quy tắc xác nhận</h2><div className="mode-list"><button type="button" className={`mode-option ${confirmationMode === "PAYOS_ONLY" ? "selected" : ""}`} onClick={() => setConfirmationMode("PAYOS_ONLY")}><QrCode size={18}/><span><strong>Chỉ payOS</strong><small>Hoàn thành sau webhook/reconcile</small></span></button><button type="button" className={`mode-option ${confirmationMode === "PAYOS_OR_MANUAL" ? "selected" : ""}`} onClick={() => setConfirmationMode("PAYOS_OR_MANUAL")}><ListChecks size={18}/><span><strong>payOS hoặc thủ công</strong><small>Ghi nhận audit thủ công khi cần</small></span></button></div></section>{error && <div className="form-error" role="alert">{error}</div>}<button className="button primary" style={{ width: "100%", marginTop: 14, display: "flex", justifyContent: "center", alignItems: "center", gap: 7 }} onClick={submit} disabled={saving}>{saving ? "Đang tạo…" : "Tạo kế hoạch"}<ArrowRight size={17}/></button></SimplePage>;
}
