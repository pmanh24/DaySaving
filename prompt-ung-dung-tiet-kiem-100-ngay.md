# PROMPT XÂY DỰNG ỨNG DỤNG WEB “THỬ THÁCH TIẾT KIỆM 100 NGÀY”

> **Lưu ý sử dụng prompt:** Khi đưa prompt này cho AI/code generator, hãy đính kèm ảnh UI tham chiếu. Ảnh chỉ được dùng để tham khảo phong cách thiết kế, bố cục, màu sắc, độ bo góc và cảm giác giao diện; không sao chép logo, tên thương hiệu, hình ảnh máy bay hoặc nội dung thuộc ứng dụng trong ảnh.

---

## 1. Vai trò của AI

Bạn là một **Senior Full-stack Engineer kiêm Senior Product Designer**, có kinh nghiệm thực tế với:

- Next.js App Router.
- NestJS.
- MongoDB và Mongoose.
- TypeScript strict mode.
- Thiết kế mobile-first.
- Responsive web/PWA.
- Authentication bằng JWT và HttpOnly Cookie.
- Deploy frontend lên Vercel.
- Deploy backend lên Render.
- MongoDB Atlas.
- Cloudflare R2.
- Tailwind CSS.
- shadcn/ui.
- Radix UI.
- TanStack Query.
- Zustand.
- Swagger/OpenAPI.
- Thiết kế UI theo phong cách fintech hiện đại, tối giản, cao cấp.

Nhiệm vụ của bạn là thiết kế và xây dựng một ứng dụng web hoàn chỉnh có tên tạm thời:

# **100 Days Saving**

Ứng dụng chủ yếu được sử dụng trên trình duyệt điện thoại, vì vậy phải được xây dựng theo hướng:

- Mobile-first.
- Responsive rất tốt.
- Có thể cài lên màn hình chính dưới dạng PWA.
- Trải nghiệm giống ứng dụng mobile native.
- Thao tác bằng một tay thuận tiện.
- Tốc độ tải nhanh.
- UI hiện đại, rõ ràng, không màu mè.
- Không over-engineering.
- Ưu tiên ra MVP nhanh nhưng cấu trúc phải đủ tốt để mở rộng.

---

# 2. Mục tiêu sản phẩm

Ứng dụng mô phỏng một bảng tiết kiệm gồm 100 ô được đánh số từ `1` đến `100`.

Mỗi ô tương ứng với một số tiền:

```text
Ô số 1   = 1.000 VNĐ
Ô số 2   = 2.000 VNĐ
...
Ô số 50  = 50.000 VNĐ
...
Ô số 100 = 100.000 VNĐ
```

Người dùng thực hiện thử thách trong tối đa hoặc khoảng 100 ngày:

1. Mỗi ngày người dùng chọn một ô chưa hoàn thành.
2. Người dùng bỏ ra số tiền tương ứng để tiết kiệm.
3. Người dùng nhấn xác nhận.
4. Ô được đánh dấu đã hoàn thành.
5. Hệ thống cập nhật tổng tiền, tiến độ và lịch sử.

Tổng số tiền khi hoàn thành toàn bộ 100 ô:

```text
1.000 + 2.000 + ... + 100.000 = 5.050.000 VNĐ
```

Ứng dụng không trực tiếp giữ tiền và không kết nối ngân hàng trong phiên bản MVP. Ứng dụng chỉ đóng vai trò:

- Theo dõi tiến độ.
- Tạo thói quen tiết kiệm.
- Ghi nhận số tiền đã bỏ ra.
- Nhắc nhở người dùng.
- Hiển thị thống kê.
- Tạo động lực hoàn thành thử thách.

---

# 3. Yêu cầu bắt buộc

## 3.1. Yêu cầu sản phẩm

Ứng dụng phải có:

- Đăng ký.
- Đăng nhập.
- Đăng xuất.
- Khôi phục phiên đăng nhập.
- Tạo thử thách tiết kiệm.
- Bảng 100 ô.
- Chọn một ô để tiết kiệm.
- Xác nhận trước khi đánh dấu.
- Không được chọn lại ô đã hoàn thành.
- Mặc định mỗi ngày chỉ được chọn một ô.
- Hoàn tác giao dịch trong ngày.
- Xem tổng tiền đã tiết kiệm.
- Xem số tiền còn lại.
- Xem phần trăm hoàn thành.
- Xem số ô đã hoàn thành.
- Xem lịch sử.
- Xem thống kê.
- Chọn ngẫu nhiên một ô chưa hoàn thành.
- Giao diện responsive.
- PWA cơ bản.
- Dark mode nếu không làm ảnh hưởng tốc độ phát triển.
- Deploy được lên Vercel, Render và MongoDB Atlas.

## 3.2. Yêu cầu kỹ thuật

- Toàn bộ source code dùng TypeScript.
- Bật TypeScript strict mode.
- Không dùng `any` tùy tiện.
- Không hard-code URL, secret hoặc cấu hình môi trường.
- API phải được version hóa theo `/api/v1`.
- Có Swagger/OpenAPI.
- Có validation phía frontend và backend.
- Có xử lý lỗi thống nhất.
- Có trạng thái loading, empty, error và offline.
- Có chống double-click và request trùng.
- Có idempotency key khi tạo check-in.
- Có unique index phía database.
- Không tin dữ liệu số tiền do frontend gửi lên.
- Backend phải tự tính số tiền từ số ô.
- Không xóa vật lý check-in khi hoàn tác.
- Có cấu trúc thư mục rõ ràng.
- Có README hướng dẫn chạy local và deploy.

---

# 4. Stack công nghệ bắt buộc

## 4.1. Frontend

Sử dụng:

```text
Next.js mới nhất theo App Router
TypeScript
Tailwind CSS
shadcn/ui
Radix UI
Lucide React
TanStack Query
Zustand
React Hook Form
Zod
Framer Motion
date-fns
next-themes
```

Ưu tiên:

- Server Components cho phần không cần tương tác.
- Client Components chỉ cho phần cần state hoặc interaction.
- TanStack Query quản lý server state.
- Zustand chỉ dùng cho UI state hoặc state cục bộ xuyên component.
- Không lưu bản sao toàn bộ dữ liệu server vào Zustand.
- Form dùng React Hook Form kết hợp Zod.
- Không dùng Redux nếu không thực sự cần.

## 4.2. Backend

Sử dụng:

```text
NestJS
TypeScript
Mongoose
MongoDB
class-validator
class-transformer
Passport
JWT
Argon2
Swagger
Helmet
Throttler
Pino hoặc Winston
ConfigModule
```

Yêu cầu:

- Tách module theo domain.
- DTO rõ ràng.
- Global validation pipe.
- Global exception filter.
- Response format thống nhất.
- Structured logging.
- Rate limiting cho login, register và refresh token.
- CORS chỉ cho phép domain hợp lệ.
- Cookie bảo mật.

## 4.3. Database

Sử dụng chính:

```text
MongoDB Atlas
Mongoose
```

Không dùng Cloudflare R2 làm database.

Cloudflare R2 chỉ dùng cho:

- Avatar.
- Ảnh chia sẻ thành tích.
- Ảnh nền tùy chỉnh.
- File export.
- File backup thủ công nếu có.

Trong MVP, có thể chưa cần tích hợp R2. Tuy nhiên phải thiết kế `StorageModule` để sau này thêm R2 thuận tiện.

## 4.4. Triển khai

```text
Frontend: Vercel
Backend: Render
Database: MongoDB Atlas
Object Storage: Cloudflare R2
Repository: GitHub
```

Dự án nên được tổ chức dưới dạng monorepo:

```text
pnpm workspace
```

Có thể dùng Turborepo nếu thực sự cần, nhưng không bắt buộc.

---

# 5. Kiến trúc tổng thể

```text
Người dùng trên trình duyệt điện thoại
                |
                v
        Next.js Web/PWA
             Vercel
                |
            HTTPS API
                |
                v
          NestJS REST API
              Render
                |
        -------------------
        |                 |
        v                 v
  MongoDB Atlas     Cloudflare R2
```

Frontend không được truy cập trực tiếp MongoDB.

Mọi thao tác nghiệp vụ phải đi qua NestJS API.

---

# 6. Yêu cầu UI tổng thể theo ảnh tham chiếu

## 6.1. Cảm giác thiết kế

Giao diện phải lấy cảm hứng trực tiếp từ ảnh tham chiếu với các đặc điểm:

- Phong cách fintech/travel-tech hiện đại.
- Nền xanh navy đậm ở phần hero/header.
- Nội dung chính nằm trong một panel trắng lớn.
- Panel trắng có góc trên bo rất lớn.
- Input và button dạng pill.
- Màu tím điện và xanh điện làm màu nhấn.
- CTA chính dùng gradient xanh dương sang tím.
- Font hiện đại, mềm, dễ đọc.
- Khoảng trắng rộng.
- Ít đường viền.
- Viền input mảnh màu xám lạnh.
- Icon nét mảnh, đơn giản.
- Không sử dụng quá nhiều màu.
- Không sử dụng hiệu ứng kính quá mạnh.
- Không dùng gradient tràn lan.
- Không dùng shadow đen nặng.
- Không làm giao diện giống dashboard quản trị doanh nghiệp.
- Giao diện phải giống một ứng dụng mobile cao cấp.

Không được sao chép:

- Logo trong ảnh.
- Tên thương hiệu trong ảnh.
- Biểu tượng máy bay.
- Nội dung sân bay.
- Hình nền máy bay.
- Bố cục nghiệp vụ của ứng dụng trong ảnh.

Chỉ áp dụng ngôn ngữ thiết kế.

---

# 7. Design System bắt buộc

## 7.1. Bảng màu Light Mode

```css
:root {
  --background: #F5F5FA;
  --surface: #FFFFFF;
  --surface-soft: #F8F8FC;

  --navy-950: #08005C;
  --navy-900: #0B076D;
  --navy-800: #151078;

  --primary-blue: #1F4FFF;
  --primary-indigo: #4C40FF;
  --primary-purple: #8647FF;

  --gradient-primary: linear-gradient(
    90deg,
    #1F4FFF 0%,
    #4D42FF 52%,
    #8647FF 100%
  );

  --text-primary: #121237;
  --text-secondary: #666680;
  --text-muted: #9292A8;
  --text-on-dark: #FFFFFF;

  --border: #DDDDE8;
  --border-strong: #CBCBDA;

  --success: #20B486;
  --success-soft: #E7F8F2;

  --warning: #F2A93B;
  --warning-soft: #FFF5E3;

  --danger: #E64B5D;
  --danger-soft: #FDECEF;

  --overlay: rgba(8, 0, 92, 0.42);
}
```

## 7.2. Dark Mode

Dark mode phải giữ đúng ngôn ngữ thiết kế, không chỉ đảo màu đơn giản.

```css
.dark {
  --background: #080818;
  --surface: #121225;
  --surface-soft: #18182E;

  --navy-950: #07004F;
  --navy-900: #0B076D;
  --navy-800: #19127F;

  --text-primary: #F8F8FF;
  --text-secondary: #B6B6C8;
  --text-muted: #88889D;

  --border: #2D2D46;
  --border-strong: #3B3B56;
}
```

## 7.3. Typography

Ưu tiên một trong hai font:

```text
Manrope
Inter
```

Khuyến nghị dùng `Manrope` cho heading và body để tạo cảm giác gần giống ảnh.

Quy chuẩn:

```text
Display: 32px / 40px / 700
H1:      28px / 36px / 700
H2:      24px / 32px / 700
H3:      20px / 28px / 700
Body L:  16px / 24px / 500
Body M:  14px / 22px / 500
Body S:  12px / 18px / 500
Caption: 11px / 16px / 600
Amount:  32px / 38px / 800
```

Không dùng font quá mảnh.

Số tiền phải dùng:

```css
font-variant-numeric: tabular-nums;
```

## 7.4. Bo góc

```text
Panel chính:             30px–34px
Card lớn:                24px
Card vừa:                20px
Input:                   9999px hoặc 18px
Button chính:            9999px
Bottom sheet:            30px 30px 0 0
Ô tiết kiệm:             16px
Badge:                   9999px
```

## 7.5. Shadow

Shadow phải nhẹ, mờ và thiên xanh/tím:

```css
box-shadow:
  0 18px 50px rgba(22, 18, 75, 0.10),
  0 4px 14px rgba(22, 18, 75, 0.05);
```

Không dùng shadow đen quá đậm.

## 7.6. Viền

```text
Độ dày mặc định: 1px
Màu mặc định: #DDDDE8
Viền focus: #6747FF
Focus ring: rgba(103, 71, 255, 0.20)
```

---

# 8. Layout mobile-first

## 8.1. Khung ứng dụng

Trên điện thoại:

- Chiếm toàn bộ chiều rộng.
- Header navy chiếm khoảng 210–280px tùy màn hình.
- Panel trắng phủ lên header.
- Panel trắng có `border-radius: 30px 30px 0 0`.
- Bottom navigation cố định.
- Tôn trọng safe area của iPhone.

Trên desktop:

- Không kéo nội dung tràn toàn bộ màn hình.
- Hiển thị ứng dụng trong khung giữa màn hình.
- `max-width` khuyến nghị từ `480px` đến `560px`.
- Có nền ngoài màu xám rất nhạt hoặc gradient rất nhẹ.
- Có thể hiển thị thêm panel phụ cho thống kê ở màn hình lớn, nhưng giao diện chính vẫn phải giữ cảm giác mobile app.

Ví dụ:

```css
.app-shell {
  width: 100%;
  min-height: 100dvh;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .app-shell {
    max-width: 520px;
    min-height: calc(100dvh - 32px);
    margin: 16px auto;
    border-radius: 32px;
    overflow: hidden;
    box-shadow:
      0 24px 80px rgba(22, 18, 75, 0.14);
  }
}
```

## 8.2. Breakpoint bắt buộc kiểm thử

```text
320px
360px
375px
390px
414px
430px
768px
1024px
1440px
```

## 8.3. Safe area

Phải sử dụng:

```css
padding-top: env(safe-area-inset-top);
padding-bottom: calc(
  env(safe-area-inset-bottom) + 88px
);
```

Bottom navigation:

```css
bottom: env(safe-area-inset-bottom);
```

## 8.4. Touch target

Mọi phần tử có thể nhấn phải có kích thước tối thiểu:

```text
44px x 44px
```

Button chính nên cao:

```text
50px–54px
```

---

# 9. Cấu trúc giao diện chung của từng màn hình

Mỗi màn hình chính nên có ba lớp thị giác tương tự ảnh tham chiếu:

## Lớp 1: Header màu navy

Bao gồm:

- Tên màn hình.
- Nội dung giới thiệu ngắn.
- Tổng tiền hoặc tiến độ chính.
- Nút quay lại hoặc action ở góc trên.
- Icon màu trắng hoặc tím nhạt.

## Lớp 2: Panel nội dung trắng

Panel trắng:

- Đè nhẹ lên header.
- Bo góc lớn.
- Chứa form, board, lịch sử hoặc thống kê.
- Có padding rộng.
- Không dùng quá nhiều card lồng nhau.

## Lớp 3: CTA cố định hoặc action chính

CTA:

- Dùng gradient xanh sang tím.
- Dạng pill.
- Nằm cuối màn hình hoặc cố định phía dưới.
- Text trắng, font 600–700.
- Có trạng thái loading.
- Không che bottom navigation.

---

# 10. Màn hình và luồng nghiệp vụ chi tiết

# 10.1. Splash Screen

Hiển thị trong thời gian ngắn khi khởi động:

- Logo ứng dụng tự thiết kế.
- Tên `100 Days Saving`.
- Nền navy đậm.
- Logo có gradient xanh tím.
- Không animation quá dài.
- Không giữ splash quá 1 giây nếu app đã tải xong.

---

# 10.2. Onboarding

Có tối đa 3 slide:

### Slide 1

```text
Tiết kiệm từng ngày
Mỗi ngày chọn một ô và hoàn thành một khoản tiết kiệm nhỏ.
```

### Slide 2

```text
Theo dõi tiến độ dễ dàng
Biết chính xác bạn đã tiết kiệm bao nhiêu và còn lại bao nhiêu.
```

### Slide 3

```text
Hoàn thành mục tiêu 5.050.000 VNĐ
Biến một thử thách nhỏ thành một thói quen lâu dài.
```

UI:

- Nền navy.
- Card trắng bo góc lớn.
- Illustration trừu tượng bằng hình khối.
- Không cần ảnh stock.
- Nút `Bắt đầu`.
- Link `Đã có tài khoản`.

---

# 10.3. Đăng ký

Fields:

- Họ tên.
- Email.
- Mật khẩu.
- Xác nhận mật khẩu.
- Checkbox đồng ý điều khoản.

UI:

- Header navy có tiêu đề.
- Form nằm trong panel trắng.
- Input dạng pill.
- Icon ở đầu input.
- Password có nút hiện/ẩn.
- Validation hiển thị ngay dưới field.
- CTA gradient `Tạo tài khoản`.
- Link `Đã có tài khoản? Đăng nhập`.

---

# 10.4. Đăng nhập

Fields:

- Email.
- Mật khẩu.

Action:

- Ghi nhớ đăng nhập.
- Quên mật khẩu.
- Đăng nhập.
- Chuyển sang đăng ký.

Không bắt buộc đăng nhập Google trong MVP.

---

# 10.5. Tạo thử thách

Cho phép tạo thử thách mặc định:

```text
Tên: Thử thách tiết kiệm 100 ngày
Số ô: 100
Giá trị đơn vị: 1.000 VNĐ
Mục tiêu: 5.050.000 VNĐ
```

Fields:

- Tên thử thách.
- Ngày bắt đầu.
- Chế độ:
  - Mỗi ngày một ô.
  - Linh hoạt, có thể nhiều ô mỗi ngày.
- Thứ tự:
  - Chọn tự do.
  - Chọn ngẫu nhiên.
  - Theo thứ tự tăng dần.
  - Theo thứ tự giảm dần.

Trong MVP, chỉ cần hỗ trợ đầy đủ chế độ `Chọn tự do`.

CTA:

```text
Bắt đầu thử thách
```

---

# 10.6. Trang chủ

## Header navy

Hiển thị:

```text
Chào buổi sáng, {displayName}
```

Card tổng quan:

```text
Đã tiết kiệm
1.250.000 VNĐ

24 / 100 ô
24%
```

Có progress bar gradient.

Hiển thị thêm:

- Số tiền còn lại.
- Chuỗi ngày liên tục.
- Khoản hôm nay.
- Ngày dự kiến hoàn thành.

## Panel trắng

Bao gồm:

1. Action nhanh.
2. Board 100 ô.
3. Thống kê ngắn.
4. Giao dịch gần nhất.

Action nhanh:

- `Tiết kiệm hôm nay`.
- `Chọn ngẫu nhiên`.
- `Xem lịch sử`.

Nút action dạng pill hoặc card nhỏ.

---

# 10.7. Board 100 ô

## Grid

Trên mobile:

```css
grid-template-columns: repeat(5, minmax(0, 1fr));
```

Khoảng cách:

```text
8px–10px
```

Trên tablet hoặc desktop có thể dùng:

```css
grid-template-columns: repeat(10, minmax(0, 1fr));
```

Chỉ dùng 10 cột khi mỗi ô vẫn đủ lớn để chạm.

## Nội dung ô

Hiển thị dạng ngắn:

```text
1K
2K
...
50K
...
100K
```

Có thể hiển thị số thứ tự nhỏ ở góc nếu cần.

## Trạng thái ô

### Chưa hoàn thành

- Nền trắng.
- Border xám lạnh.
- Text navy.
- Hover nâng nhẹ.
- Active scale nhẹ.

### Đã hoàn thành

- Nền gradient xanh tím.
- Text trắng.
- Icon check nhỏ.
- Có ngày hoàn thành trong tooltip hoặc detail.
- Không cho chọn lại.

### Được gợi ý ngẫu nhiên

- Border tím.
- Nền tím rất nhạt.
- Pulse nhẹ một lần.
- Không pulse liên tục.

### Đang xử lý

- Disable.
- Hiện spinner.
- Không gửi thêm request.

### Đã hoàn tác

- Trở về trạng thái chưa hoàn thành.
- Lịch sử vẫn giữ sự kiện hoàn tác.

## Kích thước đề xuất

```text
Chiều cao ô: 52px–60px
Border radius: 14px–16px
Font: 13px–15px, weight 700
```

---

# 10.8. Bottom sheet xác nhận tiết kiệm

Khi người dùng nhấn một ô chưa hoàn thành, mở bottom sheet.

Ví dụ:

```text
Tiết kiệm 37.000 VNĐ?

Bạn sẽ đánh dấu ô số 37 cho ngày hôm nay.
Sau khi xác nhận, tổng tiết kiệm sẽ tăng thêm 37.000 VNĐ.
```

Hiển thị:

- Số tiền thật lớn.
- Số ô.
- Ngày hiện tại.
- Tổng mới dự kiến.
- Nút `Hủy`.
- Nút gradient `Xác nhận tiết kiệm`.

Bottom sheet:

- Bo góc trên 30px.
- Có drag indicator.
- Không đóng khi request đang gửi.
- Có trạng thái loading.
- Hỗ trợ đóng bằng swipe nếu chưa submit.
- Focus được quản lý đúng.
- Có `aria-modal`.

---

# 10.9. Thành công sau check-in

Sau khi xác nhận:

- Hiển thị animation check ngắn.
- Có confetti rất nhẹ.
- Không kéo dài quá 1 giây.
- Cập nhật board bằng optimistic update có rollback.
- Hiện toast:

```text
Đã tiết kiệm 37.000 VNĐ
Tổng hiện tại: 1.287.000 VNĐ
```

Có action:

```text
Hoàn tác
```

Action hoàn tác chỉ hiển thị trong khoảng thời gian hợp lý hoặc trong ngày, tùy rule backend.

---

# 10.10. Chọn ngẫu nhiên

Khi bấm `Chọn ngẫu nhiên`:

1. Backend hoặc frontend lấy danh sách ô chưa hoàn thành.
2. Chọn một ô.
3. Board scroll tới ô đó.
4. Ô được highlight.
5. Mở bottom sheet xác nhận.
6. Không tự động tick nếu người dùng chưa xác nhận.

Có tùy chọn lọc:

```text
Khoản nhỏ: 1K–30K
Khoản vừa: 31K–70K
Khoản lớn: 71K–100K
Bất kỳ
```

Tùy chọn lọc có thể để giai đoạn sau nếu muốn tối giản MVP.

---

# 10.11. Lịch sử

Hiển thị timeline theo ngày.

Ví dụ:

```text
Hôm nay
Ô số 37
+37.000 VNĐ
09:15

Hôm qua
Ô số 82
+82.000 VNĐ
20:40
```

Mỗi item gồm:

- Số ô.
- Số tiền.
- Ngày.
- Giờ.
- Trạng thái:
  - Hoàn thành.
  - Đã hoàn tác.
- Nút xem chi tiết.

Bộ lọc:

- Tất cả.
- 7 ngày.
- 30 ngày.
- Khoản nhỏ nhất.
- Khoản lớn nhất.

Có pagination hoặc infinite query.

---

# 10.12. Thống kê

Hiển thị:

- Tổng đã tiết kiệm.
- Tổng mục tiêu.
- Phần trăm hoàn thành.
- Số ô hoàn thành.
- Số ô còn lại.
- Trung bình mỗi ngày.
- Khoản lớn nhất.
- Khoản nhỏ nhất.
- Chuỗi ngày liên tục.
- Chuỗi ngày tốt nhất.
- Ngày bắt đầu.
- Ngày dự kiến hoàn thành.

Biểu đồ:

- Tổng tiền theo tuần.
- Số tiền theo ngày.
- Phân bố khoản nhỏ/vừa/lớn.

Không dùng quá nhiều biểu đồ.

Ưu tiên:

- Recharts nếu cần.
- Biểu đồ đơn giản.
- Màu gradient xanh tím.
- Grid line rất nhạt.
- Tooltip gọn.

---

# 10.13. Hồ sơ và cài đặt

Bao gồm:

- Avatar.
- Họ tên.
- Email.
- Timezone.
- Tiền tệ mặc định: VNĐ.
- Theme:
  - System.
  - Light.
  - Dark.
- Bật/tắt nhắc nhở.
- Đăng xuất.
- Xóa tài khoản.
- Điều khoản.
- Chính sách bảo mật.

Không cho sửa email trực tiếp nếu chưa có flow xác minh.

---

# 10.14. Màn hình hoàn thành thử thách

Khi đủ 100 ô:

- Header navy.
- Illustration đơn giản.
- Confetti nhẹ.
- Tổng tiền `5.050.000 VNĐ`.
- Ngày bắt đầu.
- Ngày hoàn thành.
- Tổng số ngày thực tế.
- Chuỗi ngày tốt nhất.
- Nút tạo thử thách mới.
- Nút chia sẻ thành tích.

Ảnh chia sẻ có thể được tạo bằng frontend trước. Sau đó mới tích hợp R2 nếu cần lưu.

---

# 11. Bottom Navigation

Bottom navigation cố định gồm 4 tab:

```text
Trang chủ
Lịch sử
Thống kê
Cá nhân
```

Yêu cầu:

- Cao khoảng 72px chưa tính safe area.
- Nền trắng hoặc navy tùy màn hình.
- Border top rất nhẹ.
- Active icon dùng gradient hoặc màu tím.
- Inactive icon màu xám.
- Label cỡ 11px–12px.
- Không che nội dung.
- Không sử dụng hiệu ứng quá nặng.

---

# 12. Animation và micro-interaction

Sử dụng Framer Motion có kiểm soát.

## Cho phép

- Button tap scale từ `1` xuống `0.98`.
- Card hover nâng 2px trên desktop.
- Bottom sheet slide từ dưới lên.
- Progress bar tăng mượt.
- Ô hoàn thành scale nhẹ.
- Check icon xuất hiện bằng spring nhẹ.
- Page transition fade và translate rất nhỏ.
- Skeleton loading.

## Không cho phép

- Animation xoay liên tục.
- Gradient chuyển động liên tục.
- Confetti kéo dài.
- Bounce quá mạnh.
- Parallax nặng.
- Animation gây chậm trên điện thoại cũ.

Tôn trọng:

```css
@media (prefers-reduced-motion: reduce)
```

---

# 13. Accessibility

Bắt buộc:

- Semantic HTML.
- Keyboard navigation.
- Focus visible.
- Contrast đủ tốt.
- Không dùng màu làm tín hiệu duy nhất.
- Mỗi ô có `aria-label`, ví dụ:

```text
Ô số 37, số tiền 37.000 đồng, chưa hoàn thành
```

- Bottom sheet có focus trap.
- Toast dùng vùng live phù hợp.
- Button disabled thật sự khi đang loading.
- Input có label rõ.
- Error message liên kết với input.
- Không khóa zoom trên mobile.
- Không dùng text nhỏ hơn 11px.

---

# 14. Quy tắc nghiệp vụ

## 14.1. Quy tắc mặc định

1. Một thử thách mặc định có 100 ô.
2. Ô được đánh số từ 1 đến 100.
3. Giá trị một ô được tính bằng:

```ts
amount = number * unitAmount;
```

4. `unitAmount` mặc định là `1000`.
5. Mục tiêu mặc định là `5_050_000`.
6. Một ô chỉ được hoàn thành một lần.
7. Mặc định một ngày chỉ được hoàn thành một ô.
8. Ngày được tính theo timezone người dùng.
9. Timezone mặc định:

```text
Asia/Ho_Chi_Minh
```

10. Ngày bỏ lỡ không làm thử thách thất bại.
11. Thử thách hoàn thành khi đủ 100 ô.
12. Không nhất thiết phải hoàn thành trong đúng 100 ngày liên tục.
13. Backend tự tính amount.
14. Frontend chỉ gửi number.
15. Không tin `savedAmount` do frontend gửi.
16. Không xóa vật lý check-in.
17. Hoàn tác tạo trạng thái `REVERSED`.
18. Mọi thay đổi phải được kiểm tra quyền sở hữu.
19. Challenge đã `COMPLETED` không nhận check-in mới.
20. Challenge đã `ARCHIVED` chỉ được xem.

## 14.2. Trường hợp cạnh tranh request

Phải xử lý:

- Hai request cùng chọn một ô.
- Hai request chọn hai ô trong cùng ngày.
- Người dùng double-click.
- Browser retry.
- Mất mạng sau khi backend đã ghi thành công.
- Request cũ được gửi lại.
- Hai tab trình duyệt hoạt động cùng lúc.

Giải pháp:

- Idempotency key.
- Unique index.
- Transaction nếu phù hợp.
- Backend trả `409 Conflict`.
- Frontend rollback optimistic update khi lỗi.

---

# 15. Database Schema

# 15.1. Collection `users`

```ts
{
  _id: ObjectId;
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl?: string | null;
  timezone: string;
  currency: "VND";
  refreshTokenHash?: string | null;
  status: "ACTIVE" | "DISABLED";
  createdAt: Date;
  updatedAt: Date;
}
```

Index:

```ts
{ email: 1 } // unique
```

Email phải được lowercase và trim.

---

# 15.2. Collection `saving_challenges`

```ts
{
  _id: ObjectId;
  userId: ObjectId;

  name: string;

  minNumber: number;
  maxNumber: number;
  unitAmount: number;

  targetAmount: number;
  savedAmount: number;
  completedCells: number;

  mode: "ONE_PER_DAY" | "FLEXIBLE";
  selectionMode:
    | "FREE"
    | "RANDOM"
    | "ASCENDING"
    | "DESCENDING";

  startDate: Date;
  completedAt?: Date | null;

  status:
    | "ACTIVE"
    | "COMPLETED"
    | "ARCHIVED";

  createdAt: Date;
  updatedAt: Date;
}
```

Indexes:

```ts
{ userId: 1, status: 1 }
{ userId: 1, createdAt: -1 }
```

Không cho một user có nhiều challenge `ACTIVE` trong MVP, trừ khi đã quyết định hỗ trợ nhiều challenge.

---

# 15.3. Collection `saving_checkins`

```ts
{
  _id: ObjectId;
  challengeId: ObjectId;
  userId: ObjectId;

  number: number;
  amount: number;

  localDate: string;
  timezone: string;

  idempotencyKey: string;

  status:
    | "COMPLETED"
    | "REVERSED";

  createdAt: Date;
  reversedAt?: Date | null;
  reverseReason?: string | null;
  updatedAt: Date;
}
```

Indexes:

```ts
{ challengeId: 1, number: 1 } // unique theo ô active
{ challengeId: 1, localDate: 1 } // unique với ONE_PER_DAY
{ userId: 1, idempotencyKey: 1 } // unique
{ challengeId: 1, createdAt: -1 }
```

Nếu unique index cần hỗ trợ bản ghi `REVERSED`, hãy dùng partial index hoặc chiến lược dữ liệu phù hợp. Hãy giải thích rõ lựa chọn trong code.

---

# 15.4. Collection `saving_events`

```ts
{
  _id: ObjectId;
  userId: ObjectId;
  challengeId: ObjectId;
  checkinId?: ObjectId | null;

  type:
    | "CHALLENGE_CREATED"
    | "CHECKIN_CREATED"
    | "CHECKIN_REVERSED"
    | "CHALLENGE_COMPLETED"
    | "CHALLENGE_ARCHIVED";

  previousData?: Record<string, unknown> | null;
  currentData?: Record<string, unknown> | null;

  createdAt: Date;
}
```

Collection này dùng cho audit và mở rộng tương lai.

---

# 16. API Specification

Prefix:

```text
/api/v1
```

## 16.1. Auth

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

## 16.2. User

```http
GET   /api/v1/users/me
PATCH /api/v1/users/me
PATCH /api/v1/users/me/password
DELETE /api/v1/users/me
```

## 16.3. Challenge

```http
POST  /api/v1/challenges
GET   /api/v1/challenges
GET   /api/v1/challenges/current
GET   /api/v1/challenges/:challengeId
PATCH /api/v1/challenges/:challengeId
POST  /api/v1/challenges/:challengeId/archive
```

## 16.4. Board

```http
GET /api/v1/challenges/:challengeId/board
```

Response mẫu:

```json
{
  "success": true,
  "data": {
    "challenge": {
      "id": "challenge-id",
      "name": "Thử thách tiết kiệm 100 ngày",
      "savedAmount": 1250000,
      "targetAmount": 5050000,
      "completedCells": 24,
      "totalCells": 100,
      "progressPercent": 24.75,
      "remainingAmount": 3800000,
      "status": "ACTIVE"
    },
    "cells": [
      {
        "number": 1,
        "amount": 1000,
        "status": "COMPLETED",
        "completedDate": "2026-07-01"
      },
      {
        "number": 2,
        "amount": 2000,
        "status": "AVAILABLE",
        "completedDate": null
      }
    ],
    "today": {
      "localDate": "2026-07-27",
      "checked": false,
      "checkin": null
    }
  }
}
```

## 16.5. Check-in

```http
POST /api/v1/challenges/:challengeId/checkins
```

Request:

```json
{
  "number": 37,
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000"
}
```

Không nhận `amount` từ frontend.

## 16.6. Reverse

```http
POST /api/v1/checkins/:checkinId/reverse
```

Request:

```json
{
  "reason": "Nhập nhầm"
}
```

## 16.7. History

```http
GET /api/v1/challenges/:challengeId/history
```

Query:

```text
page
limit
status
fromDate
toDate
sort
```

## 16.8. Statistics

```http
GET /api/v1/challenges/:challengeId/statistics
```

## 16.9. Random suggestion

```http
GET /api/v1/challenges/:challengeId/random-suggestion
```

Query tùy chọn:

```text
range=ANY|SMALL|MEDIUM|LARGE
```

---

# 17. Response format

Success:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "CELL_ALREADY_COMPLETED",
    "message": "Ô số 37 đã được hoàn thành.",
    "details": null
  },
  "requestId": "request-id"
}
```

Các error code tối thiểu:

```text
AUTH_INVALID_CREDENTIALS
AUTH_TOKEN_EXPIRED
AUTH_UNAUTHORIZED
CHALLENGE_NOT_FOUND
CHALLENGE_NOT_ACTIVE
CELL_INVALID
CELL_ALREADY_COMPLETED
DAILY_LIMIT_REACHED
CHECKIN_NOT_FOUND
CHECKIN_ALREADY_REVERSED
IDEMPOTENCY_CONFLICT
VALIDATION_ERROR
RATE_LIMITED
INTERNAL_ERROR
```

---

# 18. Authentication và Security

## 18.1. Token

- Access token ngắn hạn.
- Refresh token dài hạn.
- Refresh token lưu trong HttpOnly Cookie.
- Refresh token được hash trong database.
- Rotate refresh token mỗi lần refresh.
- Logout xóa cookie và revoke token.
- Không lưu refresh token trong localStorage.
- Không log token.

Cookie production:

```text
HttpOnly=true
Secure=true
SameSite=Lax
Path=/
```

Nếu frontend và backend ở hai site khác nhau, phải cấu hình cookie và CORS phù hợp. Hãy giải thích rõ trong README.

## 18.2. Password

- Hash bằng Argon2.
- Tối thiểu 8 ký tự.
- Có chữ và số.
- Không trả password hash ra response.

## 18.3. CORS

Không dùng:

```ts
origin: "*"
```

Phải dùng biến môi trường:

```env
WEB_ORIGIN=https://your-app.vercel.app
```

## 18.4. Rate limit

Áp dụng mạnh hơn cho:

- Register.
- Login.
- Refresh.
- Forgot password.
- Random suggestion nếu bị abuse.

## 18.5. Headers

Dùng Helmet.

Thêm CSP phù hợp nếu triển khai đầy đủ.

## 18.6. Ownership

Mọi query challenge và check-in phải luôn kèm `userId`.

Không cho phép user truy cập tài nguyên của user khác dù biết ID.

---

# 19. Logic tạo check-in

Luồng backend:

```text
1. Xác thực user.
2. Lấy challenge theo challengeId và userId.
3. Kiểm tra challenge ACTIVE.
4. Kiểm tra number nằm trong minNumber và maxNumber.
5. Tính amount = number × unitAmount.
6. Xác định localDate theo timezone user.
7. Kiểm tra idempotencyKey.
8. Kiểm tra ô đã hoàn thành chưa.
9. Kiểm tra giới hạn một ô trong ngày.
10. Tạo check-in.
11. Tăng savedAmount.
12. Tăng completedCells.
13. Nếu đủ 100 ô, cập nhật challenge COMPLETED.
14. Tạo audit event.
15. Trả dữ liệu mới.
```

Các bước ghi dữ liệu liên quan phải có transaction hoặc giải pháp đảm bảo tính nhất quán phù hợp.

Không chỉ dựa vào check trước khi insert. Unique index vẫn bắt buộc.

---

# 20. Frontend State Management

## TanStack Query

Dùng cho:

- Current user.
- Current challenge.
- Board.
- History.
- Statistics.
- Random suggestion.

Query key rõ ràng:

```ts
["auth", "me"]
["challenges", "current"]
["challenges", challengeId, "board"]
["challenges", challengeId, "history", filters]
["challenges", challengeId, "statistics"]
```

## Zustand

Chỉ dùng cho:

- Bottom sheet state.
- Theme UI phụ.
- Filter chưa gửi server.
- Selected cell.
- Onboarding state nếu cần.

Không lưu access token trong Zustand persist.

## Optimistic update

Có thể dùng khi check-in, nhưng phải:

- Disable submit trong lúc mutation.
- Snapshot cache.
- Rollback khi API lỗi.
- Invalidate board, history và statistics sau thành công.
- Không tạo dữ liệu duplicate.

---

# 21. Offline và PWA

## 21.1. PWA

Phải có:

- `manifest.webmanifest`.
- Icon 192x192.
- Icon 512x512.
- Maskable icon.
- `display: standalone`.
- `theme_color`.
- `background_color`.
- App name.
- Short name.

## 21.2. Offline MVP

Offline chỉ cho phép:

- Xem dữ liệu board đã cache.
- Xem tổng quan gần nhất.
- Xem lịch sử gần nhất nếu đã cache.

Không cho check-in offline trong MVP.

Thông báo:

```text
Bạn đang ngoại tuyến.
Dữ liệu hiện tại chỉ để xem.
Hãy kết nối mạng để xác nhận khoản tiết kiệm.
```

Không giả vờ lưu thành công khi chưa có mạng.

---

# 22. Performance

Mục tiêu:

- First load nhanh trên 4G.
- Không gửi bundle quá lớn.
- Lazy-load chart.
- Không load toàn bộ icon library.
- Dùng Lucide theo từng icon.
- Dùng dynamic import cho phần thống kê.
- Tối ưu font bằng `next/font`.
- Tránh ảnh nền lớn.
- Không dùng video background.
- Không dùng animation nặng.
- Board 100 ô không cần virtualization, nhưng component phải gọn.
- API board trả payload ngắn.
- Cache query hợp lý.
- Render skeleton thay vì spinner toàn trang.

---

# 23. Logging và Monitoring

Backend log dạng JSON.

Mỗi request nên có:

- requestId.
- method.
- path.
- statusCode.
- durationMs.
- userId nếu có.
- errorCode nếu lỗi.

Ví dụ:

```json
{
  "level": "info",
  "event": "saving_checkin_created",
  "requestId": "req-123",
  "userId": "internal-user-id",
  "challengeId": "challenge-id",
  "number": 37,
  "amount": 37000,
  "durationMs": 42
}
```

Không log:

- Password.
- Cookie.
- Access token.
- Refresh token.
- Secret.
- MongoDB URI.
- R2 secret.
- Toàn bộ request body nhạy cảm.

---

# 24. Cấu trúc Monorepo

```text
saving-100/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── (app)/
│   │   │   ├── layout.tsx
│   │   │   ├── globals.css
│   │   │   └── manifest.ts
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── layout/
│   │   │   ├── saving-board/
│   │   │   ├── challenge/
│   │   │   └── charts/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── challenge/
│   │   │   ├── checkin/
│   │   │   ├── history/
│   │   │   └── statistics/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── providers/
│   │   ├── stores/
│   │   └── types/
│   │
│   └── api/
│       ├── src/
│       │   ├── auth/
│       │   ├── users/
│       │   ├── challenges/
│       │   ├── checkins/
│       │   ├── statistics/
│       │   ├── storage/
│       │   ├── health/
│       │   ├── common/
│       │   │   ├── decorators/
│       │   │   ├── filters/
│       │   │   ├── guards/
│       │   │   ├── interceptors/
│       │   │   ├── pipes/
│       │   │   └── constants/
│       │   ├── app.module.ts
│       │   └── main.ts
│       └── test/
│
├── packages/
│   ├── shared/
│   ├── eslint-config/
│   └── typescript-config/
│
├── .github/
│   └── workflows/
├── pnpm-workspace.yaml
├── package.json
├── .env.example
└── README.md
```

Không tạo abstraction không cần thiết.

Không bắt buộc CQRS, event bus, microservice hoặc repository pattern trong MVP.

---

# 25. Biến môi trường

## Frontend

```env
NEXT_PUBLIC_APP_NAME=100 Days Saving
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

## Backend

```env
NODE_ENV=development
PORT=4000

WEB_ORIGIN=http://localhost:3000

MONGODB_URI=mongodb+srv://...

JWT_ACCESS_SECRET=replace-me
JWT_ACCESS_EXPIRES_IN=15m

JWT_REFRESH_SECRET=replace-me
JWT_REFRESH_EXPIRES_IN=30d

COOKIE_DOMAIN=
COOKIE_SECURE=false

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
```

Phải validate env khi backend khởi động.

Không để backend chạy nếu biến bắt buộc bị thiếu.

---

# 26. Deployment

## 26.1. Vercel

- Deploy `apps/web`.
- Cấu hình root directory phù hợp.
- Khai báo `NEXT_PUBLIC_API_URL`.
- Không expose secret backend.
- Có preview deployment.

## 26.2. Render

- Deploy `apps/api`.
- Có health endpoint:

```http
GET /health
```

- Bind đúng `process.env.PORT`.
- Có build command và start command rõ ràng.
- Có thể dùng Dockerfile nếu cần ổn định.
- Không lưu file upload trên filesystem của Render.

## 26.3. MongoDB Atlas

- Tạo database user riêng.
- Không dùng tài khoản admin chung.
- IP allowlist phù hợp.
- Connection string lưu trong env.
- Tạo index khi deploy.
- Không commit URI lên Git.

## 26.4. Cloudflare R2

Chưa bắt buộc tích hợp ngay.

Khi tích hợp:

- Upload bằng presigned URL hoặc qua backend.
- Validate MIME type.
- Giới hạn dung lượng.
- Tạo tên file ngẫu nhiên.
- Không dùng filename người dùng làm path trực tiếp.
- Không public bucket nếu không cần.
- Avatar có kích thước giới hạn.

---

# 27. Testing

## 27.1. Backend unit test

Test:

- Tính amount.
- Validate number.
- Check daily limit.
- Check duplicate cell.
- Check idempotency.
- Reverse check-in.
- Complete challenge.
- Ownership.
- Timezone localDate.

## 27.2. Backend integration/e2e

Test:

1. Register.
2. Login.
3. Create challenge.
4. Get board.
5. Create check-in.
6. Tạo lại cùng idempotency key.
7. Tick cùng ô lần hai.
8. Tick ô khác cùng ngày.
9. Reverse.
10. Tick lại sau reverse theo rule đã chọn.
11. User khác truy cập challenge.
12. Challenge completed không nhận check-in.
13. Invalid token.
14. Expired token.
15. Refresh token rotation.

## 27.3. Frontend test

Test:

- Board render đủ 100 ô.
- Completed cell disabled.
- Bottom sheet mở đúng.
- Amount được format đúng.
- Loading state.
- API error.
- Offline state.
- Responsive navigation.
- Form validation.
- Optimistic rollback.

## 27.4. Test case cạnh tranh

Bắt buộc kiểm thử:

- Hai request song song cùng number.
- Hai request song song khác number nhưng cùng localDate.
- Double-click.
- Hai browser tab.
- Retry sau timeout.
- Request gửi lúc 23:59 và 00:01.
- User thay challengeId trên request.
- Frontend gửi amount giả.
- Reverse hai lần.

---

# 28. Định dạng tiền và ngày

Tiền phải hiển thị theo VNĐ:

```ts
new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});
```

Trên board được phép rút gọn:

```text
1K
25K
100K
```

Nhưng trong bottom sheet, lịch sử và thống kê phải hiển thị đầy đủ:

```text
37.000 VNĐ
```

Ngày:

```text
27/07/2026
```

Timezone mặc định:

```text
Asia/Ho_Chi_Minh
```

Không dùng trực tiếp timezone của server để xác định ngày tiết kiệm.

---

# 29. Nội dung tiếng Việt trong UI

Sử dụng nội dung thân thiện, ngắn gọn.

Ví dụ:

```text
Tiết kiệm hôm nay
Chọn một ô để bắt đầu
Bạn đã hoàn thành 24 trong 100 ô
Còn 3.800.000 VNĐ để đạt mục tiêu
Chọn ngẫu nhiên
Xác nhận tiết kiệm
Hoàn tác
Xem lịch sử
Không có giao dịch
Bạn đang ngoại tuyến
Ô này đã được hoàn thành
Hôm nay bạn đã tiết kiệm rồi
```

Không dùng ngôn ngữ quá kỹ thuật với người dùng cuối.

---

# 30. Empty, Loading và Error State

## Empty board

Không xảy ra vì board luôn có 100 ô, nhưng nếu chưa có challenge:

```text
Bạn chưa có thử thách nào
Hãy tạo thử thách đầu tiên để bắt đầu tiết kiệm.
```

## Empty history

```text
Chưa có khoản tiết kiệm nào
Hãy chọn một ô trên bảng để bắt đầu.
```

## Loading

- Dùng skeleton.
- Không dùng spinner toàn màn hình quá lâu.
- Board skeleton giữ nguyên layout để tránh nhảy giao diện.

## Error

```text
Không thể tải dữ liệu
Vui lòng thử lại.
```

Có nút:

```text
Thử lại
```

## Render cold start

Nếu API phản hồi chậm:

- Hiển thị cache gần nhất.
- Hiện nhãn `Đang đồng bộ`.
- Không chặn toàn bộ UI.
- Không báo lỗi quá sớm.
- Cho phép retry.

---

# 31. Yêu cầu không được làm

- Không dùng Cloudflare R2 làm database.
- Không dùng Firebase nếu không được yêu cầu.
- Không dùng Redux chỉ để quản lý một vài state.
- Không lưu JWT dài hạn trong localStorage.
- Không để CORS `*` khi dùng cookie.
- Không gửi amount từ frontend rồi tin tưởng trực tiếp.
- Không xóa vật lý check-in.
- Không cho tick ô đã hoàn thành.
- Không cho request trùng tạo hai giao dịch.
- Không hard-code timezone server.
- Không tạo UI theo phong cách admin dashboard.
- Không dùng quá nhiều card lồng nhau.
- Không dùng quá nhiều màu.
- Không sao chép thương hiệu trong ảnh.
- Không tạo code pseudo hoặc placeholder.
- Không để TODO cho chức năng cốt lõi.
- Không bỏ qua responsive.
- Không chỉ làm đẹp ở kích thước 390px.
- Không viết toàn bộ ứng dụng trong một file.
- Không tạo microservice.
- Không over-engineering.

---

# 32. Lộ trình triển khai

## Giai đoạn 1: Setup

- Tạo monorepo.
- Setup Next.js.
- Setup NestJS.
- Setup lint, format và TypeScript.
- Setup shared types.
- Setup MongoDB.
- Setup Swagger.
- Setup env validation.

## Giai đoạn 2: Authentication

- Register.
- Login.
- Refresh.
- Logout.
- Me.
- Cookie.
- Guard.
- Rate limit.

## Giai đoạn 3: Challenge

- Create challenge.
- Get current challenge.
- Board.
- Basic progress.

## Giai đoạn 4: Check-in

- Create check-in.
- Unique indexes.
- Idempotency.
- Reverse.
- Audit event.
- Complete challenge.

## Giai đoạn 5: Frontend chính

- App shell.
- Auth screens.
- Home.
- Board.
- Bottom sheet.
- History.
- Statistics.
- Profile.
- Responsive.
- PWA.

## Giai đoạn 6: Hoàn thiện

- Test.
- Accessibility.
- Loading/error.
- Dark mode.
- Deployment.
- README.
- Seed data.
- Demo account nếu cần.

---

# 33. Tiêu chí nghiệm thu

Ứng dụng chỉ được xem là hoàn thành khi đáp ứng đầy đủ:

## Chức năng

- Có thể đăng ký.
- Có thể đăng nhập.
- Có thể tạo challenge.
- Board hiển thị đủ 100 ô.
- Chọn ô cập nhật đúng amount.
- Không chọn trùng ô.
- Không vượt giới hạn ngày.
- Double-click không tạo dữ liệu trùng.
- Hoàn tác hoạt động.
- Tổng tiền chính xác.
- Tiến độ chính xác.
- History chính xác.
- Statistics chính xác.
- Challenge hoàn thành đúng lúc.

## UI

- Giao diện gần với phong cách ảnh tham chiếu.
- Header navy.
- Panel trắng bo góc lớn.
- Input pill.
- CTA gradient xanh tím.
- Typography hiện đại.
- Khoảng trắng tốt.
- Mobile-first.
- Không bị tràn ở 320px.
- Dùng tốt trên iPhone 11 Pro Max, iPhone 15 Plus và các thiết bị Android phổ biến.
- Bottom navigation không che nội dung.
- Hỗ trợ safe area.
- Dark mode không lỗi contrast.
- Touch target đủ lớn.

## Kỹ thuật

- TypeScript strict.
- Không có lỗi lint nghiêm trọng.
- Không expose secret.
- API có Swagger.
- Có env example.
- Có README.
- Deploy được Vercel.
- Deploy được Render.
- Kết nối MongoDB Atlas.
- Health check hoạt động.
- Test core business logic.
- Không có TODO ở luồng chính.

---

# 34. Cách AI phải trả kết quả

Không chỉ giải thích lý thuyết.

Hãy thực hiện theo trình tự:

1. Tóm tắt kiến trúc đã chọn.
2. In cây thư mục dự án.
3. Liệt kê lệnh khởi tạo.
4. Tạo từng file source code hoàn chỉnh.
5. Không bỏ qua file cấu hình.
6. Không dùng pseudo-code.
7. Không dùng dấu `...` thay cho code.
8. Không để TODO trong chức năng chính.
9. Viết backend trước theo module.
10. Viết frontend theo feature.
11. Viết MongoDB indexes.
12. Viết Swagger.
13. Viết test cốt lõi.
14. Viết `.env.example`.
15. Viết README chạy local.
16. Viết hướng dẫn deploy Vercel.
17. Viết hướng dẫn deploy Render.
18. Viết hướng dẫn MongoDB Atlas.
19. Chỉ thêm R2 sau khi MVP chính chạy ổn.
20. Sau mỗi giai đoạn, cung cấp checklist kiểm tra.

Nếu lượng code quá dài, chia thành nhiều phần theo thứ tự hợp lý, nhưng mỗi file được cung cấp phải đầy đủ và có thể chạy được.

---

# 35. Kết quả cuối cùng mong muốn

Một ứng dụng web/PWA tiết kiệm 100 ngày có:

- UI hiện đại theo phong cách ảnh tham chiếu.
- Trải nghiệm mobile giống native app.
- Màu navy, trắng, xanh điện và tím điện.
- Panel trắng bo góc lớn.
- Input pill.
- CTA gradient.
- Board 100 ô trực quan.
- Backend NestJS an toàn.
- Database MongoDB nhất quán.
- Frontend Next.js responsive.
- Có thể deploy ngay lên:
  - Vercel.
  - Render.
  - MongoDB Atlas.
  - Cloudflare R2 khi cần.
- Cấu trúc đủ đơn giản để hoàn thành MVP nhanh.
- Cấu trúc đủ rõ để nâng cấp thành sản phẩm thật sau này.
