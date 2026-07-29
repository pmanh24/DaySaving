"use client";

import { Check, Copy, QrCode, RefreshCw, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { ChallengePayment } from "@saving/shared";
import { money } from "@/lib/format";

interface ChallengePaymentSheetProps {
  payment: ChallengePayment;
  onClose: () => void;
  onReconcile: () => void;
  onCancel: () => void;
  loading: boolean;
}

export function ChallengePaymentSheet({ payment, onClose, onReconcile, onCancel, loading }: ChallengePaymentSheetProps) {
  const qrValue = payment.qrCode ?? payment.checkoutUrl ?? payment.description;
  const paid = payment.status === "PAID";
  return <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) onClose(); }}>
    <section className="sheet payment-sheet" role="dialog" aria-modal="true" aria-labelledby="challenge-payment-title">
      <div className="drag" />
      <div className="hero-row">
        <div><p className="eyebrow" style={{ color: "#666" }}>PAYOS · Ô SỐ {payment.number}</p><h2 id="challenge-payment-title">Gửi tiền vào quỹ</h2></div>
        <button className="icon-button" style={{ color: "#111", borderColor: "#e5e5e2", background: "#fff" }} onClick={onClose} disabled={loading} aria-label="Đóng"><X size={18} /></button>
      </div>
      {paid ? <div className="payment-success"><Check size={22} /><strong>Đã nhận thanh toán</strong><span>Ô số {payment.number} đã được hoàn thành.</span></div> : <>
        <p>Quét mã QR bằng ứng dụng ngân hàng và chuyển đúng số tiền bên dưới.</p>
        <div className="qr-wrap"><QRCodeSVG value={qrValue} size={190} includeMargin /></div>
        <div className="sheet-amount">{money(payment.amount)}</div>
        <p className="qr-help">Ô chỉ được hoàn thành sau khi hệ thống nhận thành công.</p>
        <div className="payment-actions">
          <button className="button secondary" onClick={() => { if (payment.checkoutUrl) void navigator.clipboard?.writeText(payment.checkoutUrl); }} disabled={loading}><Copy size={16} /> Link thanh toán</button>
          <button className="button secondary" onClick={onReconcile} disabled={loading}><RefreshCw size={16} /> Kiểm tra</button>
        </div>
        <button className="cancel-link" onClick={onCancel} disabled={loading}>Hủy payment</button>
      </>}
    </section>
  </div>;
}
