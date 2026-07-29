# 100 Days Saving

Ứng dụng PWA mobile-first theo dõi thử thách tiết kiệm 100 ô. Monorepo dùng pnpm gồm:

- `apps/web`: Next.js App Router, Tailwind-style CSS tokens, TanStack Query, Zustand, React Hook Form và Zod.
- `apps/api`: NestJS REST API `/api/v1`, Swagger, validation, Helmet, throttling, JWT HttpOnly cookie và repository in-memory.
- `packages/shared`: các kiểu dữ liệu dùng chung.

## Chạy local

```bash
pnpm install
pnpm dev
```

Mở `http://localhost:3000`. Mặc định frontend chạy demo mode nên không cần database. Swagger ở `http://localhost:4000/docs` và health check ở `http://localhost:4000/health`.

## Kết nối MongoDB sau

Điền `MONGODB_URI` và các JWT secret trong biến môi trường backend. Repository hiện tại cố ý dùng in-memory để UI/API chạy ngay khi chưa có DB; schema và index MongoDB nằm trong `apps/api/src/database/schemas`. Thay provider `SavingRepository` bằng adapter Mongoose tại `apps/api/src/database` khi có connection string.

## Deploy

- Vercel: root directory `apps/web`, đặt `NEXT_PUBLIC_API_URL` và tắt `NEXT_PUBLIC_DEMO_MODE`.
- Render: root directory `apps/api`, build `pnpm install --frozen-lockfile && pnpm build`, start `pnpm start:prod`.
- MongoDB Atlas: dùng database user riêng, allowlist IP phù hợp, không commit URI.

Không lưu token dài hạn trong localStorage và không gửi `amount` từ frontend; backend tự tính `number * unitAmount`.

## Kế hoạch linh hoạt 1–300 ngày

Luồng mới nằm ở `/plan/new` và `/plan`:

- Chọn 1–300 lượt đóng tiền, preset 30/100/300 hoặc số tùy chỉnh.
- Sinh slot bằng `CLASSIC_SEQUENCE`, `TARGET_AUTO_DISTRIBUTION` hoặc `CUSTOM_LIST`.
- Mỗi ngày chọn một slot `AVAILABLE`; slot không gắn cứng với ngày.
- Slot chuyển `RESERVED` khi tạo payment, chỉ chuyển `PAID` sau webhook/reconcile.
- Slot `PAID` không được chọn lại; amount trùng vẫn là các slot khác nhau.

Backend endpoint chính:

```text
POST /api/v1/saving-plans/preview
POST /api/v1/saving-plans
GET  /api/v1/saving-plans/:planId/today
GET  /api/v1/saving-plans/:planId/slots
POST /api/v1/saving-plans/:planId/payments
POST /api/v1/payments/:paymentId/reconcile
POST /api/v1/payments/:paymentId/cancel
POST /api/v1/integrations/payos/webhook
```

## payOS

`PayosService` dùng SDK `@payos/node` khi đủ ba secret `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`. Khi chạy local chưa có secret, hệ thống trả payment QR mock để kiểm thử UI; nút “Mô phỏng webhook payOS (local)” chỉ phục vụ demo và không được dùng cho production.

Return URL không phải nguồn sự thật. Frontend chỉ hiển thị trạng thái tạm và backend phải đọc database/reconcile hoặc xử lý webhook đã verify. `PAYMENT_DESTINATION_MODE` mặc định là `SINGLE_OWNER_CHANNEL`; không bật `PLATFORM_CHANNEL` âm thầm.

Các schema mới nằm trong `apps/api/src/database/schemas.ts`: `saving_plans`, `saving_slots`, `saving_payments`, `saving_day_records` và `payos_webhook_events`.
