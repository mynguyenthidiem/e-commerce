# E-Commerce — Tài liệu chi tiết tính năng

> **Mục đích:** File này là bản ghi đầy đủ về kiến trúc và tính năng của toàn bộ project (backend + frontend). Đọc file này thay vì quét lại codebase.
> **Cập nhật lần cuối:** 2026-06-08

---

## 1. Technology Stack

| Thành phần | Công nghệ |
|---|---|
| Framework | ASP.NET Core 8.0 (Web API) |
| ORM | Entity Framework Core 8.0 |
| Database | SQL Server (LocalDB) |
| Authentication | JWT (HS256, 60 phút) |
| Password Hashing | BCrypt.Net-Next v4.0.3 |
| Image Upload | Cloudinary (CloudinaryDotNet v1.29.1) |
| Payment Gateway | VNPay Sandbox (HMAC-SHA512) |
| API Docs | Swagger / Swashbuckle v6.6.2 |
| Testing | xUnit |
| Frontend | React 18 + Vite + Tailwind CSS v4 + Ant Design |

---

## 2. Cấu trúc thư mục

```
Backend/
├── E-commerce/
│   ├── Controllers/       # API endpoints
│   ├── Models/            # Entity (DB models)
│   ├── DTOs/              # Request / Response objects
│   ├── Services/          # Business logic
│   ├── Repositories/      # Data access layer
│   ├── Data/              # AppDbContext
│   ├── MiddleWares/       # Global exception handler
│   ├── Helpers/           # Utility classes (BaseResponse, v.v.)
│   ├── Migrations/        # EF Core migrations
│   ├── appsettings.json
│   └── Program.cs
└── E-commerce.Tests/      # Unit test project

Frontend/E-commerce/src/
├── api/                   # Axios API clients
├── context/               # React Context providers
├── pages/                 # Page components
│   ├── customer/          # Customer-facing pages
│   └── admin/             # Admin pages
└── components/            # Shared components
    └── customer/          # Customer components (Navbar, Footer, NotificationBell...)
```

---

## 3. Database Schema

### User
| Field | Type | Ghi chú |
|---|---|---|
| Id | Guid | PK |
| Name | string(100) | Tên đăng nhập |
| Email | string(100) | Unique (khi IsDeleted=false) |
| Password | string(100) | BCrypt hash |
| FullName | string(100)? | |
| PhoneNumber | string(10) | |
| Address | string? | |
| CreatedDate | DateTime | |
| totalSpend | decimal(18,2) | Tổng chi tiêu |
| RoleId | Guid | FK → Role |
| IsDeleted | bool | Soft delete |

### Role
| Id (seed) | Name |
|---|---|
| 00000000-0000-0000-0000-000000000001 | Admin |
| 00000000-0000-0000-0000-000000000002 | Staff |
| 00000000-0000-0000-0000-000000000003 | Customer |

### Product
| Field | Type | Ghi chú |
|---|---|---|
| Id | Guid | PK |
| Name | string(100) | |
| Description | string(200)? | |
| Price | decimal(18,2) | Giá gốc |
| AverageRating | double | 0–5 |
| CategoryId | Guid | FK |
| BrandId | Guid | FK |
| IsDeleted | bool | Soft delete |
| → ProductVariants | 1:N | |
| → ProductImages | 1:N | |
| → Reviews | 1:N | |

### ProductVariant
| Field | Type | Ghi chú |
|---|---|---|
| Id | Guid | ValueGeneratedNever |
| ProductId | Guid | FK |
| Name | string | Ví dụ: "Red-M", "Blue-L" |
| Price | decimal(18,2) | |
| Quantity | int | Stock |

### ProductImage
| Field | Type | Ghi chú |
|---|---|---|
| ProductImageId | Guid | ValueGeneratedNever |
| ProductId | Guid | FK |
| ImageUrl | string | Cloudinary URL |

### Category
| Field | Type | Ghi chú |
|---|---|---|
| Id | Guid | PK |
| Name | string(100) | |
| IsDeleted | bool | |

### Brand
| Field | Type | Ghi chú |
|---|---|---|
| Id | Guid | PK |
| Name | string(150) | |

### Cart
| Field | Type | Ghi chú |
|---|---|---|
| Id | Guid | PK |
| UserId | Guid | FK, Unique (1:1 với User) |
| CreatedAt | DateTime | |
| → CartItems | 1:N | Cascade delete |

### CartItem
| Field | Type | Ghi chú |
|---|---|---|
| Id | Guid | PK |
| CartId | Guid | FK |
| ProductVariantId | Guid | FK |
| Quantity | int | |

### Order
| Field | Type | Ghi chú |
|---|---|---|
| Id | Guid | PK |
| OrderDate | DateTime | UTC |
| SubTotal | decimal(18,2) | Tổng trước giảm |
| DiscountAmount | decimal(18,2) | |
| TotalAmount | decimal(18,2) | Tổng thanh toán |
| Status | OrderStatus enum | Pending / Processing / Shipped / Delivered / Cancelled |
| UserId | Guid | FK |
| ReceiverName | string(100) | Snapshot |
| ReceiverPhone | string(15) | Snapshot |
| ShippingAddress | string(500) | Snapshot "Street, Ward, District, Province" |
| PaymentMethodId | Guid | FK |
| VoucherId | Guid? | FK (nullable, SetNull khi xóa) |

### OrderDetail
| Field | Type | Ghi chú |
|---|---|---|
| Id | Guid | PK |
| OrderId | Guid | FK |
| ProductVariantId | Guid | FK |
| OrderQuantity | int | |
| UnitPrice | decimal(18,2) | Giá lúc order |

### Review
| Field | Type | Ghi chú |
|---|---|---|
| Id | Guid | PK |
| ProductId | Guid | FK |
| UserId | Guid | FK |
| OrderDetailId | Guid? | FK (nullable) |
| Rating | int | 1–5 |
| Comment | string(500)? | |
| CreatedDate | DateTime | UTC |
| Image | string? | URL ảnh review |

### Voucher
| Field | Type | Ghi chú |
|---|---|---|
| Id | Guid | PK |
| Code | string(50) | Unique |
| DiscountType | enum | Percentage / FixedAmount |
| DiscountValue | decimal(18,2) | |
| MinOrderAmount | decimal(18,2) | Đơn tối thiểu |
| MaxDiscountAmount | decimal(18,2) | Giảm tối đa |
| TotalQuantity | int | |
| UsedCount | int | |
| StartDate | DateTime | |
| EndDate | DateTime | |
| IsActive | bool | |

### PaymentMethod
| Field | Type | Ghi chú |
|---|---|---|
| Id | Guid | PK |
| Name | string(100) | Tên chứa "vnpay" sẽ trigger VNPay flow |
| Description | string(255)? | |
| IsActive | bool | |

### ShippingAddress
| Field | Type | Ghi chú |
|---|---|---|
| Id | Guid | PK |
| UserId | Guid | FK |
| FullName | string(100) | |
| PhoneNumber | string(15) | |
| Province | string(100) | Tỉnh/Thành phố |
| District | string(100) | Quận/Huyện |
| Ward | string(100) | Phường/Xã |
| Street | string(255) | Số nhà, tên đường |
| IsDefault | bool | |

### SupportRequest
| Field | Type | Ghi chú |
|---|---|---|
| Id | Guid | PK |
| UserId | Guid | FK |
| StaffId | Guid? | FK (Staff phụ trách) |
| OrderId | Guid? | FK (nullable) |
| Subject | string(150) | |
| Message | string(1000) | |
| Status | string(50) | Pending / InProgress / Resolved |
| CreatedDate | DateTime | |

### Notification *(mới)*
| Field | Type | Ghi chú |
|---|---|---|
| Id | Guid | PK |
| UserId | Guid | FK → User |
| Title | string(150) | Tiêu đề ngắn |
| Message | string(500) | Nội dung |
| IsRead | bool | Default false |
| CreatedAt | DateTime | UTC |
| Type | string(50) | ORDER_CONFIRMED / ORDER_CANCELLED / PAYMENT_FAILED / TICKET_REPLY |

---

## 4. API Endpoints

### Authentication — `api/auth`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | /api/auth/register | None | Đăng ký tài khoản Customer |
| POST | /api/auth/login | None | Đăng nhập, trả về JWT |

**Register validation:** Password ≥ 6 ký tự, 1 uppercase, 1 digit, 1 special char; Email hợp lệ; PhoneNumber 10 số.

---

### Products — `api/products`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| GET | /api/products?pageSize=1000 | Anonymous | Danh sách sản phẩm (filter + phân trang, max 1000) |
| GET | /api/products/{id} | Anonymous | Chi tiết sản phẩm |
| POST | /api/products | Admin | Tạo sản phẩm (kèm variants + images) |
| PUT | /api/products/{id} | Admin, Staff | Cập nhật sản phẩm |
| DELETE | /api/products/{id} | Admin | Soft delete sản phẩm |

---

### Product Variants — `api/products/{id}/variants`, `api/variants/{id}`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| GET | /api/products/{id}/variants | Anonymous | Danh sách variants |
| POST | /api/products/{id}/variants | Admin, Staff | Thêm variant |
| PUT | /api/variants/{id} | Admin, Staff | Cập nhật variant |
| DELETE | /api/variants/{id} | Admin, Staff | Xóa variant |

---

### Product Images — `api/products/{id}/images`, `api/images/**`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | /api/products/{id}/images | Admin, Staff | Thêm URL ảnh vào sản phẩm |
| DELETE | /api/images/{id} | Admin, Staff | Xóa ảnh |
| POST | /api/images/upload | Admin, Staff | Upload ảnh lên Cloudinary (multipart/form-data) |

---

### Categories — `api/categories`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| GET | /api/categories | Anonymous | Danh sách danh mục |
| POST | /api/categories | Admin | Tạo danh mục |
| PUT | /api/categories/{id} | Admin | Cập nhật |
| DELETE | /api/categories/{id} | Admin | Xóa |

---

### Brands — `api/brands`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| GET | /api/brands | Anonymous | Danh sách thương hiệu |
| POST | /api/brands | Admin | Tạo thương hiệu |
| PUT | /api/brands/{id} | Admin | Cập nhật |
| DELETE | /api/brands/{id} | Admin | Xóa |

---

### Cart — `api/cart`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| GET | /api/cart | Required | Xem giỏ hàng (kèm TotalPrice) |
| POST | /api/cart/add | Required | Thêm / tăng số lượng sản phẩm |
| PUT | /api/cart/update | Required | Cập nhật số lượng item |
| DELETE | /api/cart/remove?productVariantId= | Required | Xóa 1 item |
| DELETE | /api/cart | Required | Xóa toàn bộ giỏ |

**CartItemDto fields:** Id, ProductVariantId, **ProductId** *(thêm mới)*, ProductName, ProductVariantName, Price, Quantity

---

### Orders — `api/orders`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | /api/orders | Customer, Admin | Tạo đơn từ giỏ hàng |
| GET | /api/orders | Admin, Staff | Tất cả đơn hàng |
| GET | /api/orders/my?status= | Customer, Admin | Đơn của user (filter theo status, sort mới nhất) |
| GET | /api/orders/{id} | Required | Chi tiết đơn |
| PUT | /api/orders/{id}/status | Admin, Staff | Cập nhật trạng thái đơn |
| PUT | /api/orders/{id}/cancel | Customer, Admin | Hủy đơn (chỉ khi Pending) |

**Order Creation Flow:**
1. Validate ShippingAddress thuộc user
2. Kiểm tra giỏ không trống
3. Validate voucher (nếu có): active, chưa hết hạn, còn lượt, đơn đủ MinAmount
4. Kiểm tra tồn kho tất cả variants
5. Tính SubTotal → áp dụng voucher → tính TotalAmount
6. Snapshot thông tin giao hàng vào Order
7. Tạo OrderDetails, trừ kho, tăng UsedCount voucher
8. Xóa CartItems đã order
9. **Gửi in-app notification "Đặt hàng thành công"** *(mới)*

**OrderDetailResponse fields:** Id, ProductVariantId, ProductName, VariantName, OrderQuantity, UnitPrice, TotalPrice, **ImageUrl** *(thêm mới)*

**`GET /api/orders/my` query params:**
- `status` (int?, optional): 0=Pending, 1=Processing, 2=Shipped, 3=Delivered, 4=Cancelled
- Mặc định sort theo `OrderDate` descending

---

### Reviews — `api/products/{id}/reviews`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| GET | /api/products/{id}/reviews | Anonymous | Danh sách review |
| GET | /api/products/{id}/can-review | Customer | Kiểm tra có thể review không |
| POST | /api/products/{id}/reviews | Customer | Tạo review |
| PUT | /api/products/{id}/reviews/{reviewId} | Customer | Cập nhật review của mình |
| DELETE | /api/products/{id}/reviews/{reviewId} | Required | Xóa (chủ sở hữu hoặc Admin) |

**Điều kiện review:** Đã mua sản phẩm + chưa review sản phẩm đó.

---

### Vouchers — `api/vouchers`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| GET | /api/vouchers | None | Danh sách voucher |
| GET | /api/vouchers/{id} | None | Chi tiết voucher |
| POST | /api/vouchers/validate | None | Kiểm tra & tính chiết khấu |
| POST | /api/vouchers | Admin | Tạo voucher |
| PATCH | /api/vouchers/{id} | Admin | Cập nhật voucher |
| DELETE | /api/vouchers/{id} | Admin | Xóa voucher |

---

### Shipping Addresses — `api/shipping-addresses`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| GET | /api/shipping-addresses | Customer, Admin | Danh sách địa chỉ của mình |
| POST | /api/shipping-addresses | Customer, Admin | Thêm địa chỉ |
| PUT | /api/shipping-addresses/{id} | Customer, Admin | Cập nhật địa chỉ |
| DELETE | /api/shipping-addresses/{id} | Customer, Admin | Xóa địa chỉ |
| PATCH | /api/shipping-addresses/{id}/default | Customer, Admin | Đặt làm mặc định |

---

### Payment Methods — `api/payment-methods`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| GET | /api/payment-methods | None | Danh sách PTTT |
| POST | /api/payment-methods | Admin | Tạo PTTT |
| PUT | /api/payment-methods/{id} | Admin | Cập nhật |
| DELETE | /api/payment-methods/{id} | Admin | Xóa |

---

### Payment / VNPay — `api/payment` *(mới)*

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | /api/payment/vnpay/create | Required | Tạo URL thanh toán VNPay |
| GET | /api/payment/vnpay/ipn | None | IPN callback từ VNPay |

**VNPay Flow:**
1. Frontend tạo order → gọi `POST /api/payment/vnpay/create` với `orderId`
2. Backend tạo URL có HMAC-SHA512 signature → trả về URL
3. Frontend redirect user sang VNPay sandbox
4. User thanh toán → VNPay gọi IPN vào backend
5. Backend verify signature → cập nhật OrderStatus → gửi notification
6. VNPay redirect user về `/payment/result` (frontend)

**VNPay Config:**
```json
{
  "VNPay": {
    "TmnCode": "<merchant_code>",
    "HashSecret": "<hash_secret>",
    "BaseUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    "ReturnUrl": "http://localhost:5173/payment/result"
  }
}
```

---

### Support Requests — `api/supports`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | /api/supports | Customer | Tạo ticket hỗ trợ |
| GET | /api/supports | Customer | Tickets của mình |
| GET | /api/supports/all?status= | Admin, Staff | Tất cả tickets (filter theo status) |
| PATCH | /api/supports/{id}/status | Admin, Staff | Cập nhật status ticket + gửi notification |

**Notification trigger:** Khi status đổi sang `InProgress` hoặc `Resolved` → gửi in-app notification cho customer.

---

### Notifications — `api/notifications` *(mới)*

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| GET | /api/notifications | Required | Danh sách notification của user |
| GET | /api/notifications/unread-count | Required | Số notification chưa đọc |
| PATCH | /api/notifications/{id}/read | Required | Đánh dấu 1 notification đã đọc |
| PATCH | /api/notifications/read-all | Required | Đánh dấu tất cả đã đọc |

---

### Reports — `api/reports`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| GET | /api/reports/revenue?startDate=&endDate= | Admin | Báo cáo doanh thu |
| GET | /api/reports/orders | Admin | Thống kê đơn hàng |
| GET | /api/reports/customers?top=5 | Admin | Top khách hàng theo chi tiêu |

---

### User Profile — `api/user`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | /api/user/create-staff-admin | Admin | Tạo tài khoản Staff/Admin |
| GET | /api/user/profile | Customer, Admin | Xem profile |
| PUT | /api/user/profile | Customer, Admin | Cập nhật profile |
| PUT | /api/user/password | Customer, Admin | Đổi mật khẩu |
| DELETE | /api/user/profile | Required | Soft delete tài khoản |

---

### Admin — `api/admins`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| GET | /api/admins/customers | Admin | Danh sách Customers |
| GET | /api/admins/staff | Admin | Danh sách Staff |

---

## 5. Authentication & Authorization

**JWT Configuration:**
```json
{
  "Jwt": {
    "Key": "YourSuperSecretKeyMinimum32Characters!!",
    "Issuer": "ECommerceAPI",
    "Audience": "ECommerceClient",
    "ExpiryInMinutes": 60
  }
}
```

**Claims trong token:**
- `aud`: "ECommerceClient"
- `iss`: "ECommerceAPI"
- `email`: email user
- `nameid` (ClaimTypes.NameIdentifier): UserId (Guid)
- `role`: tên role (Admin / Staff / Customer)
- `exp`: hết hạn sau 60 phút

**Lưu ý quan trọng:** Token JWT là snapshot tại thời điểm login. Nếu dùng token cũ (trước khi sửa code), `GetUserId()` có thể trả null → crash 500. Fix: logout → login lại để lấy token mới.

**Roles — quyền truy cập:**
- `Admin` — toàn quyền + có thể mua hàng (cart, order, address, profile)
- `Staff` — quản lý sản phẩm, đơn hàng, hỗ trợ
- `Customer` — mua hàng, review, quản lý cá nhân

---

## 6. In-App Notification System *(mới)*

**Notification Types:**
| Type | Trigger | Mô tả |
|---|---|---|
| ORDER_CONFIRMED | `OrderService.CreateOrder` | Sau khi tạo đơn thành công |
| ORDER_CANCELLED | `OrderService.CancelOrder` | Sau khi hủy đơn thành công |
| PAYMENT_FAILED | `PaymentController.Ipn` | Khi VNPay IPN trả về status ≠ "00" |
| TICKET_REPLY | `SupportService.UpdateTicketStatusAsync` | Khi status đổi sang InProgress/Resolved |

**Frontend:** `NotificationBell` component trong Navbar — hiển thị badge số chưa đọc, dropdown danh sách notification.

---

## 7. VNPay Payment Integration *(mới)*

**Signature algorithm:** HMAC-SHA512 trên chuỗi URL-encoded params, sort alphabetically.

**Key points:**
- Hash được tính trên chuỗi **URL-encoded** (không phải raw)
- `vnp_TxnRef` = orderId (Guid string)
- `vnp_Amount` = TotalAmount × 100 (VNPay tính theo đơn vị nhỏ nhất)
- Frontend detect VNPay bằng: `paymentMethod.name.toLowerCase().includes('vnpay')`
- `PaymentResultPage` tại route `/payment/result` đọc `vnp_ResponseCode` từ URL params

---

## 8. Response Format chuẩn

```json
{
  "success": true,
  "message": "...",
  "data": { ... },
  "statusCode": 200
}
```

---

## 9. Middleware

**GlobalExceptionMiddleware:**
- 401 status code → JSON `{"message": "Unauthorized. Please login first."}`
- 403 status code → JSON `{"message": "You do not have permission..."}`
- Unhandled exception → 500; trả `ex.Message` khi `IsDevelopment()`, trả `"An unexpected error occurred."` khi production

---

## 10. Cloudinary Image Upload

1. POST multipart/form-data → `/api/images/upload`
2. Upload lên folder `ecommerce/products`
3. Trả về `SecureUrl`

---

## 11. Database Migrations (theo thứ tự)

| Migration | Nội dung |
|---|---|
| 20260523164623_InitialCreate | Schema ban đầu |
| 20260523165531_SeedRoles | Seed 3 roles |
| 20260524073127_AddShippingAddress | Thêm bảng ShippingAddress |
| 20260524152254_AddIsDeletedToProduct | Soft delete cho Product |
| 20260524172958_AddCategoryIsDeleted | Soft delete cho Category |
| AddNotification *(mới)* | Thêm bảng Notifications |

---

## 12. Service & Repository Layer

**Services:** JwtService, LoginService, RegisterService, ProductService, CartService, OrderService, ReviewService, VoucherService, PaymentMethodService, UserService, AdminUserService, AdminService, ShippingAddressService, SupportService, StaffService, ReportService, ProductVariantService, ProductImageService, CategoryService, BrandService, **VNPayService** *(mới)*, **NotificationService** *(mới)*

**StaffService.CreateStaff — quan trọng:** Password được hash bằng BCrypt trước khi lưu DB. Trước đây lưu plaintext gây `SaltParseException` khi login.

**Repositories:** ProductRepository, ProductVariantRepository, UserRepository, RoleRepository, OrderRepository, VoucherRepository, ReviewRepository, StaffRepository, **NotificationRepository** *(mới)*

**OrderRepository — quan trọng:** Tất cả 3 methods (`GetAll`, `GetById`, `GetByUserId`) đều include:
```
OrderDetails → ProductVariant → Product → ProductImages
```
Cần `ThenInclude(p => p.ProductImages)` để `ImageUrl` trong `OrderDetailResponse` hoạt động.

---

## 13. Frontend — Key Components & Context

| File | Mô tả |
|---|---|
| `context/ProductContext.jsx` | Load 1000 sản phẩm, `refreshProduct(id)` refresh 1 sp |
| `context/NotificationContext.jsx` | Quản lý notifications, unread count |
| `context/OrderContext.jsx` | `fetchMyOrders(params)` nhận filter `{status}` |
| `context/CartContext.jsx` | Chỉ fetch cart khi `user.roleName === 'Customer'` |
| `components/customer/NotificationBell.jsx` | Chuông thông báo trong Navbar |
| `components/ScrollToTop.jsx` | Scroll về đầu trang khi chuyển route |
| `pages/customer/PaymentResultPage.jsx` | Route `/payment/result` — đọc VNPay params |
| `api/axiosInstance.js` | `privateClient` interceptor: chỉ xóa token khi **401**, không xóa khi 403 |

---

## 14. Những điểm cần lưu ý

- **VNPay chỉ là sandbox** — cần đăng ký merchant thật để production
- **IPN cần ngrok** để VNPay gọi được vào localhost khi test
- **Không có rate limiting**
- **Không có caching** (Redis hay in-memory)
- **Cloudinary credentials trong appsettings** — nên dùng user-secrets hoặc env vars
- **CORS** — Development dùng `AllowAll`, Production dùng `AllowFrontend` (chỉ cho phép `http://localhost:5173`; cần cập nhật origin khi deploy)
- **StaffController** — đã thêm `[Authorize(Roles = "Admin")]` ở class level
- **XSS** — đã triển khai Security Headers Middleware (xem mục 17)

---

## 17. Bảo mật XSS *(mới)*

Dự án áp dụng bảo vệ XSS theo mô hình **Defense in Depth** (bảo vệ nhiều lớp).

### Lớp 1 — Frontend (React)
React tự động escape toàn bộ nội dung JSX trước khi render ra DOM. Dự án không sử dụng `dangerouslySetInnerHTML` ở bất kỳ component nào.

### Lớp 2 — Security Headers Middleware

File: `Backend/E-commerce/MiddleWares/SecurityHeadersMiddleware.cs`

Tự động đính kèm các HTTP security headers vào mọi response:

| Header | Giá trị | Mục đích |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Chặn trình duyệt đoán sai MIME type |
| `X-Frame-Options` | `DENY` | Chặn nhúng trang vào iframe (Clickjacking) |
| `X-XSS-Protection` | `1; mode=block` | Bật bộ lọc XSS của trình duyệt cũ |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Giới hạn thông tin referrer |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://res.cloudinary.com; font-src 'self'` | Chỉ cho phép tài nguyên từ nguồn tin cậy (bỏ qua với `/swagger`) |

Middleware đăng ký trong `Program.cs` sau `GlobalExceptionMiddleware`.

### Lý do không cần Input Sanitization
Backend chỉ trả về JSON, không render HTML — nên không có luồng nào đưa input user trực tiếp vào HTML response.

### Kiểm chứng
DevTools → tab **Network** → chọn bất kỳ request → **Response Headers** sẽ thấy các headers trên.

---

## 15. Connection String

```
Server=localhost;Database=ECommerceDB;Trusted_Connection=True;TrustServerCertificate=True;
```

---

## 16. Chạy với Docker

### Yêu cầu
- Docker Desktop đã cài và đang chạy

### Các bước chạy lần đầu

**Bước 1 — Build và start:**
```bash
docker-compose up --build
```
Chờ khoảng **30 giây** để SQL Server khởi động và backend migrate xong.

**Bước 2 — Import data vào Docker DB:**
1. Mở **SSMS**, kết nối với thông tin:
   - Server: `localhost,1433`
   - Authentication: SQL Server Authentication
   - Login: `sa` / Password: `ECommerce@Strong123`
   - Tick **Trust Server Certificate**
2. Copy file backup vào container:
   ```bash
   docker cp Database/ECommerceDB_Official.bak e-commerce-db-1:/ECommerceDB_Official.bak
   ```
3. **Stop backend trước khi restore** (DB đang bị backend giữ connection):
   ```bash
   docker stop e-commerce-backend-1
   ```
4. Trong SSMS: chuột phải **Databases** → **Restore Database** → chọn file `/ECommerceDB_Official.bak`
5. Vào tab **Files** → tick **Relocate all files to folder** → điền `/var/opt/mssql/data` cho cả 2 ô → **OK**

   > ⚠️ Bước này **bắt buộc** khi restore từ Windows sang Docker (Linux). Nếu bỏ qua sẽ lỗi "Directory lookup failed".

6. Sau khi restore xong, start lại backend:
   ```bash
   docker start e-commerce-backend-1
   ```

**Bước 3 — Truy cập:**

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Swagger | http://localhost:5000/swagger |

---

### Các lần chạy tiếp theo (đã có data)
```bash
docker-compose up
```

### Chạy ngầm (không chiếm terminal)
```bash
docker-compose up -d
```

### Dừng Docker
```bash
docker-compose down
```

### Reset hoàn toàn — xóa sạch data
```bash
docker-compose down -v
```

---

### Chia sẻ cho người khác

| Cách | Yêu cầu |
|---|---|
| Qua Git (clone repo) | Người nhận cần có Docker Desktop, chạy `docker-compose up --build` |
| Docker Hub | Push image lên Hub, người nhận chỉ cần `docker-compose up` |
| File `.tar` | Export image bằng `docker save`, gửi file offline |

---

### Lưu ý & Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách fix |
|---|---|---|
| `Exclusive access could not be obtained` | Backend đang giữ connection vào DB | Stop backend trước: `docker stop e-commerce-backend-1` |
| `Directory lookup for file C:\Program Files\...` | Path Windows không tồn tại trên Linux | Tab **Files** → tick **Relocate all files** → `/var/opt/mssql/data` |
| `Database version 998 incompatible` | File `.bak` tạo từ SQL Server mới hơn Docker | Dùng image `2025-latest` trong docker-compose.yml |
| Backend crash khi start | `__EFMigrationsHistory` bị xóa | **Không bao giờ xóa** bảng này |
| `ERR_CONNECTION_REFUSED` | Backend container không chạy | Kiểm tra `docker ps`, start lại backend |
| SSMS không kết nối được | Nhập sai port | Dùng `localhost,1433` (dấu **phẩy**, không phải hai chấm) |

- **DB trong Docker là DB riêng** — không dùng chung với local SQL Server
- **VNPay IPN** vẫn cần ngrok khi test trong Docker
- **Sau `docker-compose down -v`**: volume bị xóa, phải restore lại `.bak` từ đầu
- **Chia sẻ cho người khác**: gửi kèm file `Database/ECommerceDB_Official.bak`
