"use client";
import { CheckCircle2, Clock3 } from "lucide-react";
import Link from "next/link";
import { SimplePage } from "@/components/simple-page";
export default function PaymentReturnPage() { return <SimplePage active="home" eyebrow="XÁC NHẬN THANH TOÁN" title="Đang xác minh giao dịch" subtitle="Đây là trang quay lại sau khi bạn thanh toán. Khoản tiết kiệm chỉ hoàn thành khi hệ thống xác nhận giao dịch."><div className="return-card"><Clock3 size={28}/><strong>Đang chờ hệ thống xác nhận</strong><p>Hệ thống đang kiểm tra trạng thái thanh toán. Vui lòng không tự đánh dấu khoản tiền đã hoàn thành.</p><Link className="button primary" href="/plan">Quay lại kế hoạch <CheckCircle2 size={17}/></Link></div></SimplePage>; }
