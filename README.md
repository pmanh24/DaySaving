# 100 Days Saving

Ứng dụng PWA mobile-first để lập và theo dõi kế hoạch tiết kiệm 1–300 ngày.

- `apps/web`: Next.js App Router, giao diện minimalism trắng–đen, gọi trực tiếp REST API.
- `apps/api`: NestJS `/api/v1`, JWT access token, refresh token HttpOnly cookie, validation, throttling và payOS.
- `packages/shared`: kiểu dữ liệu dùng chung giữa web và API.

## Chạy local

```bash
pnpm install
pnpm dev
```

Frontend: `http://localhost:3000`
API: `http://localhost:4000`
Swagger: `http://localhost:4000/docs`
Mongo health: `http://localhost:4000/api/v1/health/database`

Frontend luôn yêu cầu phiên đăng nhập backend. Hãy tạo `apps/web/.env.local` với:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

API cần `apps/api/.env` với `MONGODB_URI`, các JWT secret và cấu hình payOS. Database mặc định là `saving_100_app`.

## Auth và dữ liệu

Người dùng đăng ký/đăng nhập qua backend. Access token được giữ trong state của frontend; refresh token được lưu bằng cookie HttpOnly và được xoay vòng khi refresh. User, challenge, check-in, kế hoạch, slot, payment và day record được lưu qua các collection MongoDB tương ứng.

## Lập kế hoạch

Luồng nằm ở `/plan/new` và `/plan`:

- Chọn 1–300 lượt đóng tiền, preset 30/100/300 hoặc nhập số tùy chỉnh.
- Chọn `CLASSIC_SEQUENCE`, `TARGET_AUTO_DISTRIBUTION` hoặc `CUSTOM_LIST`.
- Bản xem trước được tính bởi `POST /api/v1/saving-plans/preview`; frontend không tự quyết định số tiền cuối cùng.
- Slot được tạo ở backend, chuyển `AVAILABLE → RESERVED → PAID` theo payment đã xác minh.
- Amount trùng nhau vẫn là các slot riêng; không gán cứng amount vào ngày.

Endpoint chính:

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

Khi có đủ `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, API dùng SDK payOS thật. Nếu chưa có credentials ở môi trường development, API dùng provider local để có thể kiểm thử luồng backend; trạng thái hoàn thành vẫn chỉ do backend xác nhận.

Không commit URI MongoDB hoặc secret vào Git. Nếu secret từng xuất hiện trong file mẫu cũ, hãy rotate secret đó trên MongoDB Atlas.
