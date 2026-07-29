"use client";

import { Banknote, LoaderCircle, QrCode, X } from "lucide-react";
import { money } from "@/lib/format";

interface ConfirmSheetProps {
  number: number;
  amount: number;
  total: number;
  onClose: () => void;
  onCashConfirm: () => void;
  onPayosConfirm: () => void;
  loading: boolean;
}

export function ConfirmSheet({ number, amount, total, onClose, onCashConfirm, onPayosConfirm, loading }: ConfirmSheetProps) {
  return <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) onClose(); }}>
    <section className="sheet" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="drag" />
      <div className="hero-row">
        <div><p className="eyebrow" style={{ color: "#666" }}>Ô SỐ {number}</p><h2 id="confirm-title">Chọn cách tiết kiệm</h2></div>
        <button className="icon-button" style={{ color: "#111", borderColor: "#e5e5e2", background: "#fff" }} onClick={onClose} disabled={loading} aria-label="Đóng"><X size={18} /></button>
      </div>
      <div className="sheet-amount">{money(amount)}</div>
      <p>Chọn một cách để hoàn thành ô này. Số tiền và trạng thái sẽ do backend ghi nhận.</p>
      <div className="sheet-summary">
        <div className="sheet-stat"><span>Tổng hiện tại</span><strong>{money(total)}</strong></div>
        <div className="sheet-stat"><span>Sau khi hoàn thành</span><strong>{money(total + amount)}</strong></div>
      </div>
      <div className="choice-list">
        <button className="choice-card" onClick={onCashConfirm} disabled={loading}>
          <span className="choice-icon"><Banknote size={20} /></span>
          <span className="choice-copy"><strong>Tự tiết kiệm tiền mặt</strong><small>Bạn tự bỏ tiền vào phong bì hoặc nơi riêng của mình, rồi tick ô.</small></span>
          {loading ? <LoaderCircle size={18} className="spin" /> : null}
        </button>
        <button className="choice-card choice-card-dark" onClick={onPayosConfirm} disabled={loading}>
          <span className="choice-icon"><QrCode size={20} /></span>
          <span className="choice-copy"><strong>Gửi vào quỹ qua payOS</strong><small>Backend tạo QR payOS để bạn chuyển đúng số tiền.</small></span>
          {loading ? <LoaderCircle size={18} className="spin" /> : null}
        </button>
      </div>
      <button className="button secondary sheet-cancel" onClick={onClose} disabled={loading}>Để sau</button>
    </section>
  </div>;
}
