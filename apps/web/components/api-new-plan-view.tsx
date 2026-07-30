"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Info, ListChecks, QrCode, Sparkles, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AmountGenerationMode, SavingPlan } from "@saving/shared";
import { useAuth } from "@/components/auth-provider";
import { SimplePage } from "@/components/simple-page";
import { apiRequest } from "@/lib/api";
import { money } from "@/lib/format";

interface PreviewResponse {
  amounts: number[];
  targetAmount: number;
  slotCount: number;
}

interface ModeHelp {
  title: string;
  summary: string;
  explanation: string;
  example: string;
}

const today = new Date().toISOString().slice(0, 10);

const modeHelp: Record<AmountGenerationMode, ModeHelp> = {
  CLASSIC_SEQUENCE: {
    title: "Tăng dần đều",
    summary: "Tăng số tiền theo từng ngày",
    explanation: "Bạn chọn một khoản cơ bản. Mỗi ngày, số tiền sẽ tăng thêm đúng khoản cơ bản đó.",
    example: "Nếu chọn 5.000đ: ngày 1 là 5.000đ, ngày 2 là 10.000đ, ngày 3 là 15.000đ.",
  },
  TARGET_AUTO_DISTRIBUTION: {
    title: "Đạt mục tiêu đã chọn",
    summary: "Đặt tổng tiền, hệ thống tự sắp xếp",
    explanation: "Bạn nhập tổng số tiền muốn đạt, khoản thấp nhất, khoản cao nhất và mức làm tròn. Hệ thống sẽ tạo đủ số khoản theo số ngày và cộng lại đúng mục tiêu.",
    example: "Ví dụ kế hoạch 50 ngày, mục tiêu 3.600.000đ, mỗi ngày từ 50.000đ đến 200.000đ, làm tròn theo 1.000đ.",
  },
  CUSTOM_LIST: {
    title: "Tự chọn số tiền mỗi ngày",
    summary: "Nhập riêng khoản tiền cho từng ngày",
    explanation: "Bạn tự quyết định số tiền của từng ngày. Các khoản không bắt buộc phải tăng dần, nên có thể thay đổi theo thu nhập và lịch sinh hoạt của bạn.",
    example: "Kế hoạch 50 ngày cần đủ 50 khoản, theo đúng thứ tự từ ngày 1 đến ngày 50.",
  },
};

export function ApiNewPlanView() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [name, setName] = useState("Quỹ du lịch");
  const [durationDays, setDurationDays] = useState(30);
  const [generationMode, setGenerationMode] = useState<AmountGenerationMode>("CLASSIC_SEQUENCE");
  const [openInfoMode, setOpenInfoMode] = useState<AmountGenerationMode | null>(null);
  const [unitAmount, setUnitAmount] = useState(5000);
  const [targetAmount, setTargetAmount] = useState(3000000);
  const [minAmount, setMinAmount] = useState(20000);
  const [maxAmount, setMaxAmount] = useState(200000);
  const [stepAmount, setStepAmount] = useState(1000);
  const [customText, setCustomText] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [confirmationMode, setConfirmationMode] = useState<"PAYOS_ONLY" | "PAYOS_OR_MANUAL">("PAYOS_OR_MANUAL");
  const [paymentExpiresInMinutes, setPaymentExpiresInMinutes] = useState(15);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const customAmounts = customText.split(/[,\n]/).map((value) => Number(value.trim())).filter((value) => Number.isFinite(value));

  useEffect(() => {
    if (!accessToken || durationDays < 30 || durationDays > 300) {
      setPreview(null);
      setPreviewError("");
      return;
    }
    const timer = window.setTimeout(() => {
      setPreviewLoading(true);
      setPreviewError("");
      void apiRequest<PreviewResponse>("/saving-plans/preview", { method: "POST", body: JSON.stringify({ durationDays, generationMode, unitAmount, targetAmount, minAmount, maxAmount, stepAmount, customAmounts }) }, accessToken)
        .then(setPreview)
        .catch((previewFailure: unknown) => {
          setPreview(null);
          setPreviewError(previewFailure instanceof Error ? previewFailure.message : "Không thể tạo bản xem trước.");
        })
        .finally(() => setPreviewLoading(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [accessToken, customText, durationDays, generationMode, maxAmount, minAmount, stepAmount, targetAmount, unitAmount]);

  const submit = () => {
    if (name.trim().length < 2 || durationDays < 30 || durationDays > 300 || !preview || preview.slotCount !== durationDays) {
      setError("Vui lòng kiểm tra tên, số ngày và danh sách khoản tiền.");
      return;
    }
    setError("");
    setSaving(true);
    void apiRequest<{ plan: SavingPlan; slotCount: number }>("/saving-plans", { method: "POST", body: JSON.stringify({ name, durationDays, generationMode, unitAmount, targetAmount, minAmount, maxAmount, stepAmount, customAmounts, startDate, timezone: "Asia/Ho_Chi_Minh", progressMode: "FLEXIBLE_CONTRIBUTION_DAYS", confirmationMode, paymentDestinationMode: "SINGLE_OWNER_CHANNEL", paymentExpiresInMinutes }) }, accessToken ?? undefined)
      .then((result) => router.push(`/plan?planId=${result.plan.id}`))
      .catch((submissionError: unknown) => setError(submissionError instanceof Error ? submissionError.message : "Không thể tạo kế hoạch."))
      .finally(() => setSaving(false));
  };

  const chooseMode = (mode: AmountGenerationMode) => {
    setGenerationMode(mode);
    setOpenInfoMode(null);
  };

  const toggleInfo = (mode: AmountGenerationMode) => {
    setOpenInfoMode((current) => current === mode ? null : mode);
  };

  const renderModeOption = (mode: AmountGenerationMode, icon: ReactNode) => {
    const detail = modeHelp[mode];
    const isSelected = generationMode === mode;
    const isInfoOpen = openInfoMode === mode;
    return <div className={`mode-option ${isSelected ? "selected" : ""}`} key={mode}>
      <button type="button" className="mode-option-main" onClick={() => chooseMode(mode)} aria-pressed={isSelected}>
        {icon}
        <span><strong>{detail.title}</strong><small>{detail.summary}</small></span>
      </button>
      <button type="button" className={`mode-info ${isInfoOpen ? "active" : ""}`} onClick={() => toggleInfo(mode)} aria-label={`Giải thích ${detail.title}`} aria-expanded={isInfoOpen}>
        <Info size={16} />
      </button>
      {isInfoOpen && <div className="mode-details" role="note">
        <strong>{detail.title}</strong>
        <p>{detail.explanation}</p>
        <span><b>Ví dụ:</b> {detail.example}</span>
      </div>}
    </div>;
  };

  return <SimplePage active="plan" eyebrow="KẾ HOẠCH MỚI" title="Tạo kế hoạch" subtitle="Bạn chọn số ngày và cách tiết kiệm phù hợp với mình. Hệ thống sẽ xem trước kết quả trước khi tạo kế hoạch.">
    <section className="wizard-card">
      <div className="wizard-icon"><Target size={22}/></div>
      <h2>Thông tin kế hoạch</h2>
      <label className="field-label">Tên kế hoạch<input className="pill-input" value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label className="field-label">Số ngày<p className="field-help">Chọn từ 30 đến 300 ngày. Bảng kế hoạch sẽ được tạo đúng theo số ngày này.</p><div className="preset-row">{[30, 50, 100, 120, 300].map((days) => <button type="button" className={`preset ${durationDays === days ? "selected" : ""}`} onClick={() => setDurationDays(days)} key={days}>{days} ngày</button>)}<input className="pill-input compact" type="number" min={30} max={300} value={durationDays} onChange={(event) => setDurationDays(Number(event.target.value))}/></div></label>
      <label className="field-label">Ngày bắt đầu<input className="pill-input" type="date" min={today} value={startDate} onChange={(event) => setStartDate(event.target.value)}/></label>
    </section>

    <section className="wizard-card" style={{ marginTop: 12 }}>
      <div className="wizard-icon"><ListChecks size={22}/></div>
      <h2>Danh sách khoản tiền</h2>
      <p className="section-caption plan-option-intro">Chọn cách hệ thống tạo số tiền cho từng ngày. Bấm vào biểu tượng <span className="inline-info"><Info size={12}/></span> để xem giải thích và ví dụ.</p>
      <div className="mode-list">
        {renderModeOption("CLASSIC_SEQUENCE", <ListChecks size={18}/>)}
        {renderModeOption("TARGET_AUTO_DISTRIBUTION", <Sparkles size={18}/>)}
        {renderModeOption("CUSTOM_LIST", <Target size={18}/>)}
      </div>
      {generationMode === "CLASSIC_SEQUENCE" && <label className="field-label">Khoản cơ bản<p className="field-help">Đây là số tiền của ngày đầu tiên và cũng là mức tăng thêm sau mỗi ngày.</p><input className="pill-input" type="number" min={1} value={unitAmount} onChange={(event) => setUnitAmount(Number(event.target.value))}/></label>}
      {generationMode === "TARGET_AUTO_DISTRIBUTION" && <div className="two-fields"><label className="field-label">Tổng mục tiêu<input className="pill-input" type="number" value={targetAmount} onChange={(event) => setTargetAmount(Number(event.target.value))}/></label><label className="field-label">Mức làm tròn<p className="field-help">Ví dụ 1.000đ nghĩa là các khoản sẽ theo bội số 1.000đ.</p><input className="pill-input" type="number" value={stepAmount} onChange={(event) => setStepAmount(Number(event.target.value))}/></label><label className="field-label">Khoản thấp nhất<input className="pill-input" type="number" value={minAmount} onChange={(event) => setMinAmount(Number(event.target.value))}/></label><label className="field-label">Khoản cao nhất<input className="pill-input" type="number" value={maxAmount} onChange={(event) => setMaxAmount(Number(event.target.value))}/></label></div>}
      {generationMode === "CUSTOM_LIST" && <label className="field-label">Số tiền theo từng ngày<p className="field-help">Nhập mỗi khoản trên một dòng hoặc ngăn cách bằng dấu phẩy. Số lượng khoản phải bằng số ngày.</p><textarea className="custom-textarea" value={customText} onChange={(event) => setCustomText(event.target.value)} placeholder="20000\n50000\n100000"/></label>}
      <div className="preview-strip"><span>{previewLoading ? "Đang tính…" : `${preview?.slotCount ?? 0} khoản`}</span><strong>{preview ? money(preview.targetAmount) : "—"}</strong></div>
      {preview?.amounts.length ? <div className="amount-preview">{preview.amounts.slice(0, 12).map((amount, index) => <span key={`${amount}-${index}`}>{money(amount)}</span>)}{preview.amounts.length > 12 && <span>…</span>}</div> : null}
      {previewError && <div className="form-error" role="alert">{previewError}</div>}
    </section>

    <section className="wizard-card" style={{ marginTop: 12 }}>
      <div className="wizard-icon"><QrCode size={22}/></div>
      <h2>Quy tắc xác nhận</h2>
      <div className="mode-list">
        <button type="button" className={`mode-option confirmation-option ${confirmationMode === "PAYOS_ONLY" ? "selected" : ""}`} onClick={() => setConfirmationMode("PAYOS_ONLY")}><QrCode size={18}/><span><strong>Chỉ payOS</strong><small>Khoản tiền được xác nhận tự động sau khi thanh toán thành công.</small></span></button>
        <button type="button" className={`mode-option confirmation-option ${confirmationMode === "PAYOS_OR_MANUAL" ? "selected" : ""}`} onClick={() => setConfirmationMode("PAYOS_OR_MANUAL")}><ListChecks size={18}/><span><strong>payOS hoặc xác nhận thủ công</strong><small>Bạn có thể xác nhận đã tiết kiệm tiền mặt nếu không dùng thanh toán QR.</small></span></button>
      </div>
      <label className="field-label">Thời hạn QR<select className="pill-input" value={paymentExpiresInMinutes} onChange={(event) => setPaymentExpiresInMinutes(Number(event.target.value))}><option value={10}>10 phút</option><option value={15}>15 phút</option><option value={30}>30 phút</option></select></label>
    </section>

    {error && <div className="form-error" role="alert">{error}</div>}
    <button className="button primary" style={{ width: "100%", marginTop: 14, display: "flex", justifyContent: "center", alignItems: "center", gap: 7 }} onClick={submit} disabled={saving || previewLoading}>{saving ? "Đang tạo…" : "Tạo kế hoạch"}<ArrowRight size={17}/></button>
  </SimplePage>;
}
