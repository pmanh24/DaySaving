"use client";
import { CheckCircle2, Clock3 } from "lucide-react";
import Link from "next/link";
import { SimplePage } from "@/components/simple-page";
export default function PaymentReturnPage() { return <SimplePage active="home" eyebrow="PAYOS RETURN" title="Đang xác minh giao dịch" subtitle="Return URL chỉ là điểm quay lại, không tự đánh dấu hoàn thành."><div className="return-card"><Clock3 size={28}/><strong>Đang chờ backend đối soát</strong><p>Hệ thống sẽ đọc trạng thái payment từ database và webhook payOS. Vui lòng không tự tick khoản tiền.</p><Link className="button primary" href="/plan">Quay lại kế hoạch <CheckCircle2 size={17}/></Link></div></SimplePage>; }
