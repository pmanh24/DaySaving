# PROMPT BỔ SUNG — KẾ HOẠCH TIẾT KIỆM LINH HOẠT 1–300 NGÀY VÀ QR PAYOS

> Đây là **file prompt bổ sung độc lập**, dùng cùng prompt ứng dụng tiết kiệm đã có. Không sửa hoặc ghi đè prompt cũ.
>
> Khi có nội dung xung đột, tài liệu này được ưu tiên đối với: số ngày kế hoạch, cách tạo danh sách khoản tiền, cách chọn khoản tiền theo ngày, thanh toán QR payOS, webhook và điều kiện đánh dấu hoàn thành.
>
> Toàn bộ yêu cầu cũ về Next.js, NestJS, MongoDB, Vercel, Render, responsive mobile-first, PWA và style UI navy–trắng–gradient xanh tím vẫn được giữ nguyên.

---

# 1. Vai trò và mục tiêu

Bạn là Senior Full-stack Engineer, Solution Architect và Product Designer có kinh nghiệm với:

- Next.js App Router.
- NestJS.
- MongoDB/Mongoose.
- TypeScript strict mode.
- payOS Node.js SDK.
- VietQR.
- Webhook idempotency.
- Responsive mobile-first.
- PWA.
- TanStack Query.
- Zustand.
- Tailwind CSS và shadcn/ui.

Hãy nâng cấp ứng dụng từ mô hình tick thủ công:

```text
Chọn ô → nhấn xác nhận → hệ thống tự đánh dấu hoàn thành
```

thành mô hình:

```text
Tạo kế hoạch
→ chọn số ngày từ 1 đến 300
→ thiết lập mục tiêu và danh sách khoản tiền
→ bắt đầu kế hoạch
→ đến ngày hiện tại mới chọn một khoản còn lại
→ backend tạo QR payOS
→ người dùng chuyển khoản
→ payOS gửi webhook
→ backend xác minh
→ khoản tiền mới được đánh dấu hoàn thành
```

Trong chế độ payOS, tuyệt đối không đánh dấu hoàn thành chỉ vì người dùng:

- Nhấn vào ô.
- Nhấn “Xác nhận”.
- Mở ứng dụng ngân hàng.
- Quay lại từ `returnUrl`.
- Nhấn “Tôi đã chuyển khoản”.
- Tự tick bằng tay.

Một khoản chỉ hoàn thành khi backend đã xác minh thanh toán thành công từ webhook payOS hoặc chủ động đối soát trạng thái với payOS.

---

# 2. Thay đổi nghiệp vụ cốt lõi

## 2.1. Số ngày linh hoạt

Không còn cố định 100 ngày.

Người dùng chọn:

```text
Tối thiểu: 1 ngày
Tối đa: 300 ngày
```

Cung cấp preset:

```text
30 ngày
100 ngày
300 ngày
Tùy chỉnh
```

Khi chọn `Tùy chỉnh`, cho nhập số nguyên từ 1 đến 300.

Ví dụ hợp lệ:

```text
7, 15, 30, 45, 60, 90, 100, 180, 300
```

Không hard-code chỉ hỗ trợ 30, 100 hoặc 300.

---

## 2.2. Tách “ngày tiết kiệm” khỏi “ô số tiền”

Không được hiểu:

```text
Ngày 1 = 1.000 VNĐ
Ngày 2 = 2.000 VNĐ
...
```

Phải tách thành:

### Ngày tiết kiệm

```text
Ngày tiết kiệm 1
Ngày tiết kiệm 2
...
Ngày tiết kiệm N
```

### Ô tiền

```text
1.000 VNĐ
2.000 VNĐ
37.000 VNĐ
100.000 VNĐ
...
```

Ở mỗi ngày, người dùng chọn bất kỳ ô tiền chưa được nộp.

Ví dụ kế hoạch 100 ngày:

```text
Ngày 1 → chọn 68.000 VNĐ
Ngày 2 → chọn 3.000 VNĐ
Ngày 3 → chọn 100.000 VNĐ
```

Không bắt buộc tăng dần.

Không gán trước ô tiền cho từng ngày khi tạo kế hoạch.

---

## 2.3. Chỉ chọn tiền khi đến ngày hiện tại

Trang setup chỉ thu thập:

- Tên kế hoạch.
- Số ngày.
- Mục tiêu.
- Cách sinh danh sách khoản tiền.
- Ngày bắt đầu.
- Timezone.
- Phương thức xác nhận.
- Thời hạn QR.

Không bắt người dùng nhập:

```text
Ngày 1 đóng bao nhiêu
Ngày 2 đóng bao nhiêu
...
```

Sau khi kế hoạch bắt đầu, tại ngày tiết kiệm hiện tại, người dùng mới:

```text
Chọn khoản tiền
→ tạo QR
→ thanh toán
→ chờ xác minh
```

Chỉ sau khi payment `PAID` mới chuyển sang ngày tiếp theo.

---

## 2.4. Danh sách khoản tiền phải loại trừ khoản đã nộp

Trạng thái ô:

```ts
type SavingSlotStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "PAID"
  | "MANUALLY_COMPLETED";
```

Quy tắc:

- `AVAILABLE`: được chọn.
- `RESERVED`: đang có payment chờ, disable.
- `PAID`: đã xác nhận payOS, không được chọn lại.
- `MANUALLY_COMPLETED`: chỉ dùng nếu plan cho phép ghi nhận thủ công.

Màn hình chọn tiền chỉ cho thao tác với `AVAILABLE`.

Khi payment thành công:

- Ô chuyển `PAID`.
- Ô bị loại khỏi tab `Còn lại`.
- Ô xuất hiện trong tab `Đã thanh toán`.
- Tổng còn lại cập nhật.
- Không được tái sử dụng ô.

Khi payment bị hủy/hết hạn:

- Ô `RESERVED` quay lại `AVAILABLE`.
- Ngày hiện tại vẫn chưa hoàn thành.

---

# 3. Cảnh báo kiến trúc dòng tiền

payOS chuyển tiền vào tài khoản ngân hàng liên kết với kênh thanh toán.

Phải xác định rõ:

```ts
type PaymentDestinationMode =
  | "SINGLE_OWNER_CHANNEL"
  | "PLATFORM_CHANNEL";
```

## `SINGLE_OWNER_CHANNEL` — mặc định cho MVP

- Ứng dụng phục vụ cá nhân/chủ sở hữu.
- Kênh payOS liên kết với tài khoản ngân hàng của chính chủ.
- Tiền tiết kiệm chuyển vào tài khoản đó.

## `PLATFORM_CHANNEL`

Nếu nhiều người dùng độc lập chuyển tiền vào một kênh thuộc nền tảng, tiền sẽ đi vào tài khoản nền tảng.

Không được bật âm thầm.

Trước production phải làm rõ:

- Chủ sở hữu dòng tiền.
- Điều khoản sử dụng.
- Hoàn tiền.
- Khiếu nại.
- Đối soát.
- Trách nhiệm lưu giữ tiền.
- Yêu cầu pháp lý và tuân thủ.

Không được gọi ứng dụng là ví điện tử hoặc tuyên bố ứng dụng giữ tiền nếu thực tế tiền chuyển vào tài khoản ngân hàng liên kết.

Mặc định:

```env
PAYMENT_DESTINATION_MODE=SINGLE_OWNER_CHANNEL
```

---

# 4. Trang setup kế hoạch — wizard 4 bước

Thiết kế theo style ảnh tham chiếu:

- Header navy đậm.
- Panel trắng bo góc lớn.
- Stepper dạng pill.
- Input pill.
- CTA gradient xanh dương → tím.
- Mobile-first.
- Tôn trọng safe area iPhone.
- Không giống admin dashboard.

---

## 4.1. Bước 1 — Thông tin kế hoạch

Fields:

```text
Tên kế hoạch
Số ngày
Ngày bắt đầu
Timezone
```

### Tên kế hoạch

Ví dụ:

```text
Quỹ mua điện thoại
Quỹ du lịch
Quỹ dự phòng
Thử thách tiết kiệm
```

Validation:

- Trim.
- Từ 2 đến 80 ký tự.

### Số ngày

- Integer.
- Từ 1 đến 300.
- Preset 30, 100, 300.
- Có tùy chỉnh.

Thông báo lỗi:

```text
Số ngày phải nằm trong khoảng từ 1 đến 300.
```

### Ngày bắt đầu

Cho phép:

- Hôm nay.
- Ngày trong tương lai.

Không cho ngày quá khứ.

### Timezone

Mặc định:

```text
Asia/Ho_Chi_Minh
```

Không dùng timezone server để quyết định ngày của người dùng.

---

## 4.2. Bước 2 — Tạo danh sách khoản tiền

Hỗ trợ:

```ts
type AmountGenerationMode =
  | "CLASSIC_SEQUENCE"
  | "TARGET_AUTO_DISTRIBUTION"
  | "CUSTOM_LIST";
```

### A. `CLASSIC_SEQUENCE`

Người dùng chọn:

```text
Số ngày N
Đơn vị U
```

Sinh danh sách:

```text
U, 2U, 3U, ..., NU
```

Công thức:

```ts
targetAmount =
  unitAmount * durationDays * (durationDays + 1) / 2;
```

Ví dụ:

```text
N = 100
U = 1.000 VNĐ
Danh sách: 1.000 → 100.000 VNĐ
Tổng: 5.050.000 VNĐ
```

Ví dụ:

```text
N = 30
U = 5.000 VNĐ
Danh sách: 5.000 → 150.000 VNĐ
Tổng: 2.325.000 VNĐ
```

Dù danh sách tăng dần, người dùng vẫn chọn tùy ý khi kế hoạch chạy.

### B. `TARGET_AUTO_DISTRIBUTION`

Người dùng nhập:

```text
Số ngày N
Tổng mục tiêu T
Khoản thấp nhất
Khoản cao nhất
Bước làm tròn
```

Backend tạo đúng `N` slot sao cho:

```text
sum(slots) = T
minAmount <= slot.amount <= maxAmount
slot.amount % stepAmount = 0
```

Validation:

```ts
durationDays * minAmount <= targetAmount
targetAmount <= durationDays * maxAmount
targetAmount % stepAmount === 0
minAmount % stepAmount === 0
maxAmount % stepAmount === 0
```

Nếu không thể phân bổ:

```text
Không thể phân bổ mục tiêu theo giới hạn hiện tại.
Hãy thay đổi số ngày, mục tiêu hoặc khoảng tiền.
```

Thuật toán phải:

- Chạy ở backend.
- Không sai tổng do làm tròn.
- Không tạo số âm.
- Không vượt min/max.
- Có unit test.
- Lưu kết quả cố định vào MongoDB.
- Không sinh lại mỗi lần tải trang.

Amount có thể trùng; mỗi ô phải có `slotId` riêng.

### C. `CUSTOM_LIST`

Cho phép:

- Nhập từng khoản.
- Dán nhiều dòng.
- Dán chuỗi phân cách bằng dấu phẩy.
- Import CSV ở giai đoạn nâng cấp.

Validation:

- Số lượng khoản bằng số ngày.
- Số nguyên dương.
- Không bằng 0.
- Không vượt giới hạn hệ thống.
- Amount trùng được phép.
- Tổng mục tiêu = tổng danh sách.

Không dùng amount làm unique key.

---

## 4.3. Bước 3 — Quy tắc vận hành

### Kiểu tiến độ

MVP triển khai:

```ts
type ProgressMode = "FLEXIBLE_CONTRIBUTION_DAYS";
```

Ý nghĩa:

- `durationDays` là số lượt đóng tiền.
- Bỏ lỡ ngày lịch không làm thất bại.
- Ngày tiết kiệm chỉ tăng sau payment thành công.
- Plan có thể kéo dài hơn số ngày thực tế.

Ví dụ:

```text
Kế hoạch 100 ngày
Đã đóng 12 lần
Ngày hiện tại = 13/100
```

Chuẩn bị enum tương lai:

```ts
type ProgressMode =
  | "FLEXIBLE_CONTRIBUTION_DAYS"
  | "CALENDAR_DAYS";
```

Nhưng không cần hoàn thiện `CALENDAR_DAYS` trong MVP.

### Phương thức xác nhận

```ts
type SavingConfirmationMode =
  | "PAYOS_ONLY"
  | "PAYOS_OR_MANUAL";
```

Mặc định:

```text
PAYOS_ONLY
```

Nếu bật manual:

- Hiển thị rõ `Ghi nhận thủ công`.
- Không gắn trạng thái payOS.
- Lưu `confirmationSource = MANUAL`.
- Có audit.
- Có thể yêu cầu ghi chú.
- Không bật mặc định.

### Thời hạn QR

Preset:

```text
10 phút
15 phút
30 phút
```

Khuyến nghị 15 phút.

Khi hết hạn:

- Payment `EXPIRED`.
- Slot về `AVAILABLE`.
- Ngày chưa hoàn thành.

---

## 4.4. Bước 4 — Xem trước và bắt đầu

Hiển thị:

- Tên.
- Số ngày.
- Mục tiêu.
- Số slot.
- Khoản nhỏ nhất.
- Khoản lớn nhất.
- Khoản trung bình.
- Phương thức xác nhận.
- Ngày bắt đầu.
- Ngày hoàn thành dự kiến.

CTA:

```text
Bắt đầu kế hoạch
```

Khi bắt đầu:

1. Backend tạo plan.
2. Backend tạo toàn bộ slots.
3. Xác minh tổng slots = target.
4. Chuyển plan `ACTIVE` hoặc `SCHEDULED`.
5. Không gán slot cho ngày.
6. Điều hướng trang kế hoạch.

---

# 5. Trạng thái plan và payment

## Plan

```ts
type SavingPlanStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "ARCHIVED";
```

## Payment

```ts
type PaymentStatus =
  | "CREATING"
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "CANCELLED"
  | "EXPIRED"
  | "FAILED";
```

Chỉ `PAID` được tính vào tiền tiết kiệm qua payOS.

---

# 6. Luồng của ngày tiết kiệm hiện tại

Màn hình:

```text
Ngày tiết kiệm 13 / 100
Hôm nay bạn muốn tiết kiệm bao nhiêu?
```

Nút:

```text
Chọn khoản tiền
```

Luồng:

1. Mở danh sách slot.
2. Chỉ cho chọn `AVAILABLE`.
3. Chọn một slot.
4. Hiển thị xác nhận.
5. Frontend gửi `slotId` và `idempotencyKey`.
6. Backend đọc amount từ database.
7. Backend reserve slot bằng atomic update.
8. Backend tạo internal payment.
9. Backend gọi payOS.
10. Backend lưu QR/payment link.
11. Frontend hiển thị QR.
12. Chờ webhook/reconcile.
13. Chỉ khi `PAID` mới tăng ngày.

Nếu đang có payment pending trong ngày:

- Hiển thị payment đó.
- Cho tiếp tục thanh toán.
- Cho hủy.
- Không tạo payment thứ hai.

---

# 7. Màn hình chọn khoản tiền

## Header navy

```text
Chọn khoản tiết kiệm
Ngày 13 trong 100
Còn 88 khoản chưa hoàn thành
```

## Tabs

```text
Còn lại
Đã thanh toán
Đang chờ
Tất cả
```

## Filter

```text
Nhỏ nhất
Lớn nhất
Dưới 50.000
50.000–100.000
Trên 100.000
```

## Sort

```text
Tăng dần
Giảm dần
Ngẫu nhiên
```

## Grid

Dùng 3 hoặc 4 cột tùy chiều rộng:

```css
grid-template-columns: repeat(3, minmax(0, 1fr));
```

Mỗi ô hiển thị:

```text
37K
```

Detail:

```text
37.000 VNĐ
Trạng thái: Còn lại
```

### AVAILABLE

- Nền trắng.
- Border xám.
- Text navy.
- Có thể nhấn.

### RESERVED

- Nền tím/xám nhạt.
- Icon đồng hồ.
- Disable.
- Label `Đang chờ`.

### PAID

- Gradient xanh tím.
- Icon check.
- Text trắng.
- Disable.
- Hiển thị ngày thanh toán.

### MANUALLY_COMPLETED

- Màu success riêng.
- Label `Thủ công`.

Không dùng màu làm tín hiệu duy nhất.

---

# 8. Bảng thống kê khoản tiền

Luôn có trang/section:

```text
Bảng khoản tiền
```

Tổng quan:

```text
Tổng số ô
Đã thanh toán
Đang chờ
Còn lại
Tổng đã tiết kiệm
Tổng còn lại
```

Ví dụ:

```text
100 khoản
12 đã thanh toán
1 đang chờ
87 còn lại

Đã tiết kiệm: 820.000 VNĐ
Còn lại: 4.230.000 VNĐ
```

Khi amount trùng:

```text
50.000 VNĐ × 3 ô còn lại
```

Sau khi trả một slot:

```text
50.000 VNĐ × 2 ô còn lại
```

Không xóa tất cả slot cùng amount.

---

# 9. Tích hợp payOS backend

Dùng SDK Node.js chính thức:

```bash
pnpm add @payos/node
```

Tạo module:

```text
src/payments/
├── payos/
│   ├── payos.module.ts
│   ├── payos.service.ts
│   ├── payos-webhook.controller.ts
│   ├── payos.mapper.ts
│   └── payos.types.ts
├── payments.controller.ts
├── payments.service.ts
├── payments.repository.ts
├── dto/
└── schemas/
```

Khởi tạo payOS chỉ ở backend.

Không gửi xuống frontend:

- `PAYOS_CLIENT_ID`.
- `PAYOS_API_KEY`.
- `PAYOS_CHECKSUM_KEY`.

---

# 10. Tạo payment link

Frontend chỉ gửi:

```json
{
  "slotId": "slot-id",
  "idempotencyKey": "uuid"
}
```

Backend:

```text
slotId
→ lấy slot từ database
→ kiểm tra ownership
→ kiểm tra AVAILABLE
→ lấy amount
→ reserve slot
→ tạo payment
→ gọi payOS
→ lưu paymentLinkId
→ lưu checkoutUrl
→ lưu qrCode
→ trả dữ liệu an toàn
```

Dữ liệu gửi payOS:

```ts
{
  orderCode: number;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  expiredAt: number;
}
```

Không nhận hoặc tin `amount` từ frontend.

---

# 11. orderCode và description

## orderCode

Phải:

- Là integer.
- Duy nhất toàn hệ thống.
- Có unique index.
- Không dùng MongoDB ObjectId.
- Không chỉ dùng `Date.now()` nếu có concurrency.

Khuyến nghị MongoDB atomic counter:

```ts
{
  _id: "payos_order_code";
  sequenceValue: number;
}
```

Tăng bằng `$inc`.

## Description

Ngắn, không dấu, không chứa dữ liệu nhạy cảm.

Ví dụ:

```text
TK123456
```

Không đưa email, họ tên đầy đủ hoặc userId thô vào nội dung chuyển khoản.

---

# 12. QR trong ứng dụng

Kết quả payOS có thể chứa:

```text
checkoutUrl
qrCode
paymentLinkId
status
```

Hỗ trợ:

## Cách chính

Render QR từ chuỗi `qrCode`.

Có thể dùng:

```bash
pnpm add qrcode.react
```

## Dự phòng

Nút:

```text
Mở trang thanh toán payOS
```

dùng `checkoutUrl`.

Không tự dựng payload VietQR nếu payOS đã trả `qrCode`.

---

# 13. Màn hình QR

Style:

- Header navy.
- Panel trắng bo góc lớn.
- QR nền trắng.
- CTA gradient.
- Mobile-first.

Nội dung:

```text
Thanh toán khoản tiết kiệm
Ngày 13/100
37.000 VNĐ
Đang chờ thanh toán
```

Hướng dẫn:

```text
Mở ứng dụng ngân hàng và quét mã QR
```

Buttons:

```text
Mở trang thanh toán
Kiểm tra trạng thái
Hủy thanh toán
```

Nút `Kiểm tra trạng thái` chỉ gọi reconcile; không tự đổi `PAID`.

Hiển thị countdown:

```text
QR hết hạn sau 14:32
```

Khi hết hạn:

```text
Mã QR đã hết hạn
```

Actions:

```text
Tạo lại mã
Chọn khoản khác
```

Không dựa vào timer frontend để cập nhật database.

---

# 14. Webhook payOS

Endpoint:

```http
POST /api/v1/integrations/payos/webhook
```

Webhook không yêu cầu JWT, nhưng bắt buộc verify signature bằng SDK:

```ts
payOS.webhooks.verify(payload)
```

Luồng:

1. Nhận payload.
2. Tạo requestId.
3. Verify signature.
4. Signature sai → `400`.
5. Tìm payment bằng `orderCode`.
6. Kiểm tra `paymentLinkId`.
7. Kiểm tra amount.
8. Nếu đã `PAID`, trả 2XX idempotent.
9. Chạy transaction xác nhận.
10. Trả 2XX nhanh.

Không tin payload trước khi verify.

Webhook có thể retry nhiều lần; không được cộng tiền hoặc tăng ngày hai lần.

---

# 15. Return URL không phải nguồn sự thật

Frontend route:

```text
/payment/return
```

Query params chỉ dùng để xác định payment và hiển thị trạng thái tạm.

Tuyệt đối không:

```ts
if (status === "PAID") {
  markPaid();
}
```

Luồng đúng:

```text
Return URL
→ frontend gọi backend
→ backend đọc database
→ backend reconcile nếu cần
→ trả trạng thái chính thức
```

---

# 16. Đối soát và polling

Endpoint:

```http
POST /api/v1/payments/:paymentId/reconcile
```

Luồng:

1. Kiểm tra ownership.
2. Chỉ cho payment `PENDING/PROCESSING`.
3. Gọi payOS lấy trạng thái.
4. Nếu `PAID`, gọi cùng domain service với webhook.
5. Nếu `CANCELLED`, giải phóng slot.
6. Nếu hết hạn, chuyển `EXPIRED`.
7. Có rate limit.

Frontend:

- Poll mỗi 3–5 giây trong thời gian ngắn.
- Dùng backoff.
- Dừng khi terminal status.
- Refetch khi window focus.
- Không polling vô hạn.

---

# 17. Hủy và hết hạn

## Hủy

```http
POST /api/v1/payments/:paymentId/cancel
```

- Kiểm tra ownership.
- Chỉ hủy payment phù hợp.
- Gọi payOS cancel.
- Payment → `CANCELLED`.
- Slot → `AVAILABLE`.
- Ngày chưa hoàn thành.
- Ghi audit.

Không hủy payment đã `PAID`.

## Hết hạn

MVP tối thiểu hỗ trợ lazy expiration:

```text
GET payment/today
→ nếu expiresAt < now và còn PENDING
→ reconcile lần cuối
→ nếu chưa PAID thì EXPIRED
→ release slot
```

Có thể thêm cron NestJS mỗi 5 phút.

Không dùng timer frontend làm nguồn sự thật.

---

# 18. MongoDB schema

## `saving_plans`

```ts
{
  _id: ObjectId;
  userId: ObjectId;
  name: string;

  durationDays: number;
  currentDayIndex: number;
  completedDays: number;

  generationMode:
    | "CLASSIC_SEQUENCE"
    | "TARGET_AUTO_DISTRIBUTION"
    | "CUSTOM_LIST";

  targetAmount: number;
  totalSavedAmount: number;
  remainingAmount: number;

  unitAmount?: number | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  stepAmount?: number | null;

  progressMode:
    | "FLEXIBLE_CONTRIBUTION_DAYS"
    | "CALENDAR_DAYS";

  confirmationMode:
    | "PAYOS_ONLY"
    | "PAYOS_OR_MANUAL";

  paymentDestinationMode:
    | "SINGLE_OWNER_CHANNEL"
    | "PLATFORM_CHANNEL";

  paymentExpiresInMinutes: number;
  timezone: string;
  startDate: Date;

  status:
    | "DRAFT"
    | "SCHEDULED"
    | "ACTIVE"
    | "PAUSED"
    | "COMPLETED"
    | "ARCHIVED";

  activatedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

Indexes:

```ts
{ userId: 1, status: 1 }
{ userId: 1, createdAt: -1 }
```

## `saving_slots`

```ts
{
  _id: ObjectId;
  userId: ObjectId;
  planId: ObjectId;

  slotIndex: number;
  amount: number;

  status:
    | "AVAILABLE"
    | "RESERVED"
    | "PAID"
    | "MANUALLY_COMPLETED";

  reservedByPaymentId?: ObjectId | null;
  reservationExpiresAt?: Date | null;

  assignedDayIndex?: number | null;
  paidPaymentId?: ObjectId | null;
  completedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}
```

Indexes:

```ts
{ planId: 1, slotIndex: 1 } // unique
{ planId: 1, status: 1, amount: 1 }
{ planId: 1, assignedDayIndex: 1 }
```

Không unique theo amount.

## `saving_payments`

```ts
{
  _id: ObjectId;
  userId: ObjectId;
  planId: ObjectId;
  slotId: ObjectId;

  dayIndex: number;

  provider: "PAYOS";
  orderCode: number;
  paymentLinkId?: string | null;

  amount: number;
  currency: "VND";
  description: string;

  checkoutUrl?: string | null;
  qrCode?: string | null;

  status:
    | "CREATING"
    | "PENDING"
    | "PROCESSING"
    | "PAID"
    | "CANCELLED"
    | "EXPIRED"
    | "FAILED";

  idempotencyKey: string;
  expiresAt: Date;

  paidAt?: Date | null;
  cancelledAt?: Date | null;
  providerReference?: string | null;
  transactionDateTime?: string | null;
  lastReconciledAt?: Date | null;

  errorCode?: string | null;
  errorMessage?: string | null;

  createdAt: Date;
  updatedAt: Date;
}
```

Indexes:

```ts
{ orderCode: 1 } // unique
{ paymentLinkId: 1 } // unique sparse
{ userId: 1, idempotencyKey: 1 } // unique
{ planId: 1, status: 1, createdAt: -1 }
{ slotId: 1, status: 1 }
{ expiresAt: 1, status: 1 }
```

## `saving_day_records`

```ts
{
  _id: ObjectId;
  userId: ObjectId;
  planId: ObjectId;
  slotId: ObjectId;
  paymentId?: ObjectId | null;

  dayIndex: number;
  amount: number;

  confirmationSource:
    | "PAYOS"
    | "MANUAL";

  status:
    | "COMPLETED"
    | "REVERSED";

  localCompletedDate: string;
  completedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}
```

Index:

```ts
{ planId: 1, dayIndex: 1 } // unique active
{ planId: 1, slotId: 1 }
```

## `payos_webhook_events`

```ts
{
  _id: ObjectId;
  orderCode?: number | null;
  paymentLinkId?: string | null;
  providerReference?: string | null;
  signatureHash: string;

  verified: boolean;

  processingStatus:
    | "RECEIVED"
    | "PROCESSED"
    | "IGNORED_DUPLICATE"
    | "FAILED";

  errorMessage?: string | null;
  receivedAt: Date;
  processedAt?: Date | null;
  createdAt: Date;
}
```

Không lưu payload nhạy cảm vô thời hạn nếu không cần.

---

# 19. Reserve slot atomic

Không dùng flow:

```text
find slot
→ kiểm tra trong memory
→ update không điều kiện
```

Phải atomic update với điều kiện:

```ts
{
  _id: slotId,
  planId,
  userId,
  status: "AVAILABLE"
}
```

Update:

```ts
{
  $set: {
    status: "RESERVED",
    reservedByPaymentId: paymentId,
    reservationExpiresAt: expiresAt
  }
}
```

Nếu không match:

```text
Khoản tiền này vừa được chọn hoặc đã được thanh toán.
Vui lòng chọn khoản khác.
```

---

# 20. Transaction xác nhận thành công

Tạo domain method duy nhất:

```ts
confirmSuccessfulPayment(...)
```

Được gọi từ:

- Webhook.
- Reconcile.

Trong transaction:

1. Reload payment.
2. Nếu đã `PAID`, idempotent return.
3. Kiểm tra amount.
4. Kiểm tra slot.
5. Kiểm tra dayIndex.
6. Payment → `PAID`.
7. Slot → `PAID`.
8. Gán `assignedDayIndex`.
9. Tạo day record.
10. Tăng `completedDays`.
11. Tăng `totalSavedAmount`.
12. Giảm `remainingAmount`.
13. Tăng `currentDayIndex` nếu chưa hoàn thành.
14. Nếu đủ ngày → plan `COMPLETED`.
15. Tạo audit event.

Phải xử lý đồng thời:

- Webhook lặp.
- Webhook và reconcile chạy cùng lúc.
- Hai tab.
- Hai payment cùng ngày.
- Amount mismatch.
- Slot đã được payment khác trả.
- Plan đã hoàn thành.

---

# 21. API bổ sung

Prefix:

```text
/api/v1
```

## Preview plan

```http
POST /api/v1/saving-plans/preview
```

Classic body:

```json
{
  "durationDays": 100,
  "generationMode": "CLASSIC_SEQUENCE",
  "unitAmount": 1000
}
```

Auto body:

```json
{
  "durationDays": 100,
  "generationMode": "TARGET_AUTO_DISTRIBUTION",
  "targetAmount": 10000000,
  "minAmount": 20000,
  "maxAmount": 200000,
  "stepAmount": 1000
}
```

## Plan

```http
POST /api/v1/saving-plans
POST /api/v1/saving-plans/:planId/start
GET  /api/v1/saving-plans/:planId
GET  /api/v1/saving-plans/:planId/today
```

## Slots

```http
GET /api/v1/saving-plans/:planId/slots
GET /api/v1/saving-plans/:planId/slot-statistics
```

Query:

```text
status
minAmount
maxAmount
sort
page
limit
groupByAmount
```

## Payment

```http
POST /api/v1/saving-plans/:planId/payments
GET  /api/v1/payments/:paymentId
POST /api/v1/payments/:paymentId/reconcile
POST /api/v1/payments/:paymentId/cancel
```

## Webhook

```http
POST /api/v1/integrations/payos/webhook
```

## History

```http
GET /api/v1/saving-plans/:planId/day-records
```

---

# 22. Idempotency

Frontend tạo UUID cho mỗi lần tạo payment.

Unique index:

```ts
{ userId: 1, idempotencyKey: 1 }
```

Cùng key, cùng payload:

- Trả payment cũ.
- Không reserve lần hai.
- Không gọi payOS lần hai.
- Không tạo orderCode mới.

Cùng key, khác payload:

```text
IDEMPOTENCY_CONFLICT
```

---

# 23. Error codes

```text
PLAN_DURATION_INVALID
PLAN_TARGET_INVALID
PLAN_DISTRIBUTION_IMPOSSIBLE
PLAN_NOT_ACTIVE
PLAN_NOT_STARTED
PLAN_COMPLETED
PLAN_PAUSED

SLOT_NOT_FOUND
SLOT_NOT_AVAILABLE
SLOT_RESERVED
SLOT_ALREADY_PAID

PAYMENT_ALREADY_PENDING
PAYMENT_NOT_FOUND
PAYMENT_ALREADY_PAID
PAYMENT_CANCELLED
PAYMENT_EXPIRED
PAYMENT_CREATE_FAILED
PAYMENT_AMOUNT_MISMATCH
PAYMENT_PROVIDER_UNAVAILABLE

PAYOS_WEBHOOK_INVALID
PAYOS_SIGNATURE_INVALID
PAYOS_ORDER_NOT_FOUND
PAYOS_STATUS_UNCONFIRMED

DAY_ALREADY_COMPLETED
IDEMPOTENCY_CONFLICT
```

---

# 24. Environment variables

```env
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=

PAYOS_RETURN_URL=https://your-web-domain/payment/return
PAYOS_CANCEL_URL=https://your-web-domain/payment/cancel
PAYOS_WEBHOOK_URL=https://your-api-domain/api/v1/integrations/payos/webhook

PAYOS_DEFAULT_EXPIRE_MINUTES=15
PAYMENT_DESTINATION_MODE=SINGLE_OWNER_CHANNEL
PAYOS_LIVE_E2E_ENABLED=false
```

Không dùng `NEXT_PUBLIC_` cho secret payOS.

Không log:

- API key.
- Checksum key.
- Cookie/token.
- QR payload production.
- Toàn bộ webhook payload.
- Thông tin tài khoản nhạy cảm.

---

# 25. UI trang hôm nay

Header navy:

```text
Ngày tiết kiệm 13/100
Bạn đã hoàn thành 12 ngày
```

Card tổng:

```text
Đã tiết kiệm
820.000 VNĐ

Còn lại
4.230.000 VNĐ
```

Panel trắng:

```text
Hôm nay bạn muốn tiết kiệm bao nhiêu?
```

CTA:

```text
Chọn khoản tiền
```

Nếu payment pending:

```text
Bạn đang có một khoản chờ thanh toán
37.000 VNĐ
Còn 12:24
```

Actions:

```text
Tiếp tục thanh toán
Hủy
```

---

# 26. UI thống kê

Tabs:

```text
Tổng quan
Còn lại
Đã thanh toán
Đang chờ
```

Metrics:

- Ngày hoàn thành.
- Số slot còn lại.
- Tổng đã nộp.
- Tổng còn lại.
- Khoản thấp nhất còn lại.
- Khoản cao nhất còn lại.
- Trung bình mỗi ngày.
- Payment thất bại/hết hạn.

Biểu đồ:

- Tiến độ tiền.
- Lịch sử theo ngày.
- Phân bố khoản nhỏ/vừa/lớn.

Không dùng quá nhiều biểu đồ.

---

# 27. Cập nhật realtime

MVP dùng:

- TanStack Query polling.
- Refetch khi focus.
- Manual reconcile.

Không bắt buộc WebSocket.

Khi webhook thành công:

```text
Thanh toán thành công
Bạn đã tiết kiệm 37.000 VNĐ cho ngày 13.
```

UI:

- Check animation ngắn.
- Confetti nhẹ.
- Slot chuyển PAID.
- Tổng cập nhật.
- Ngày chuyển 14/100.

Nếu webhook chậm:

```text
Đang xác minh giao dịch...
```

Không báo thất bại quá sớm.

---

# 28. Testing bắt buộc

## Amount generation

- 1 ngày.
- 30 ngày.
- 100 ngày.
- 300 ngày.
- Classic formula.
- Auto đúng tổng.
- Không vượt min/max.
- Đúng step.
- Trường hợp impossible.
- Custom list sai số lượng.
- Amount trùng.

## Slot/payment

- Chọn AVAILABLE.
- Chọn RESERVED.
- Chọn PAID.
- Hai request cùng slot.
- Hai slot cùng ngày.
- Expired release slot.
- Cancel release slot.
- Amount trùng chỉ loại đúng một slot.

## payOS mock

- Create link thành công.
- Create link lỗi.
- Timeout.
- Signature sai.
- Payment không tồn tại.
- Amount mismatch.
- Webhook lặp.
- Webhook và reconcile đồng thời.
- Return URL giả `PAID`.
- Reconcile PENDING.
- Reconcile PAID.
- Hủy payment.
- Hủy payment đã PAID.

## Progress

- Tạo QR không tăng ngày.
- Mở checkout không tăng ngày.
- Return URL không tự tăng ngày.
- Webhook hợp lệ tăng đúng một lần.
- Tổng tiền đúng.
- Slot bị loại khỏi AVAILABLE.
- Ngày cuối hoàn thành plan.

---

# 29. Môi trường test payOS

- Mock `PayosService` trong automated tests.
- Không cho test suite mặc định gọi giao dịch thật.
- Chỉ bật live E2E bằng biến môi trường và xác nhận thủ công.
- Dùng số tiền nhỏ khi kiểm thử thật.
- Kiểm thử webhook, redirect, cancel, timeout và reconcile.
- Không dùng dữ liệu production.

---

# 30. Acceptance criteria

## Setup

- Chọn 1–300 ngày.
- Có preset 30/100/300.
- Có custom duration.
- Có Classic Sequence.
- Có Target Auto Distribution.
- Có Custom List.
- Preview đúng tổng.
- Không gán amount cho từng ngày ở setup.
- Chỉ bắt đầu sau xác nhận.

## Chọn tiền

- Mỗi ngày chọn bất kỳ slot AVAILABLE.
- Không bắt buộc tăng dần.
- PAID không chọn lại.
- RESERVED không chọn.
- Amount trùng xử lý theo slot.
- Có bảng khoản còn lại.

## payOS

- Backend tạo payment link.
- Frontend hiển thị QR.
- Có checkoutUrl dự phòng.
- Có thời gian hết hạn.
- Có cancel.
- Verify webhook signature.
- Return URL không tự đánh dấu.
- Chỉ hoàn thành sau xác minh.
- Retry webhook không cộng hai lần.
- Amount khớp slot.
- Secret không lộ.

## Progress

- Chưa trả tiền thì ngày không tăng.
- Payment thành công thì slot PAID.
- Slot bị loại khỏi danh sách còn lại.
- Ngày tăng đúng một.
- Tổng đúng.
- Plan hoàn thành sau N payment thành công.

## UI

- Navy, trắng, pill, gradient xanh tím.
- Mobile-first.
- QR dễ quét.
- Không tràn 320px.
- Tương thích iPhone 11 Pro Max, iPhone 15 Plus và Android phổ biến.
- Có loading, pending, processing, expired, cancelled, error, success.

---

# 31. Những điều tuyệt đối không được làm

- Không tick khi chọn amount.
- Không tick khi tạo QR.
- Không tick vì return URL báo PAID.
- Không tin amount frontend.
- Không chọn lại slot PAID.
- Không xóa tất cả slot cùng amount.
- Không unique theo amount.
- Không tạo hai payment pending cùng ngày.
- Không tạo hai payment cùng slot.
- Không expose secret payOS.
- Không bỏ verify signature.
- Không cộng tiền hai lần khi webhook retry.
- Không gán trước amount cho ngày.
- Không hard-code 100 ngày.
- Không dùng timer frontend làm nguồn sự thật.
- Không triển khai giữ tiền nhiều người thiếu minh bạch.
- Không viết pseudo-code cho luồng cốt lõi.
- Không để TODO trong webhook/payment flow.
- Không chỉnh sửa file prompt cũ.

---

# 32. Trình tự triển khai

1. Phân tích project hiện tại.
2. Liệt kê phần cần thay đổi.
3. Thiết kế migration dữ liệu cũ.
4. Tạo schemas mới.
5. Tạo amount generation service.
6. Viết unit test.
7. Tạo setup wizard.
8. Tạo preview API.
9. Tạo plan/start APIs.
10. Tạo slot grid.
11. Tạo reservation atomic.
12. Tạo `PayosModule`.
13. Tạo payment link.
14. Tạo QR screen.
15. Tạo webhook.
16. Tạo shared confirmation service.
17. Tạo reconcile.
18. Tạo cancel/expiry.
19. Tạo thống kê.
20. Viết integration/e2e tests.
21. Cập nhật Swagger.
22. Cập nhật `.env.example`.
23. Cập nhật README payOS.
24. Hướng dẫn deploy Vercel/Render.
25. Kiểm tra responsive.
26. Cung cấp checklist nghiệm thu.

---

# 33. Kết quả cuối cùng

Ứng dụng phải hỗ trợ:

```text
Đăng nhập
→ tạo kế hoạch 1–300 ngày
→ chọn mục tiêu và cách sinh khoản tiền
→ xem preview
→ bắt đầu
→ mở ngày hiện tại
→ xem khoản còn lại
→ chọn bất kỳ khoản chưa nộp
→ reserve slot
→ tạo QR payOS
→ chuyển khoản
→ webhook được verify
→ payment PAID
→ slot PAID
→ loại khỏi danh sách còn lại
→ cập nhật thống kê
→ chuyển ngày tiếp theo
→ hoàn thành sau N lần thanh toán
```

Mục tiêu cuối cùng:

> Người dùng tự chọn mỗi ngày muốn tiết kiệm khoản nào trong danh sách còn lại, nhưng hệ thống chỉ ghi nhận hoàn thành khi giao dịch QR payOS đã được xác minh thành công.
