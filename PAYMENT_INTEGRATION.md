# Hướng dẫn tích hợp thanh toán điện tử

## Tổng quan

Dự án đã được tích hợp các cổng thanh toán điện tử phổ biến tại Việt Nam cho môi trường dev/test:

- **Stripe**: Thanh toán bằng thẻ tín dụng/ghi nợ quốc tế
- **VNPay**: Cổng thanh toán trực tuyến Việt Nam
- **MoMo**: Ví điện tử MoMo
- **ZaloPay**: Ví điện tử ZaloPay

## Cấu trúc hệ thống

### Backend (NestJS)

```
src/
├── entities/
│   └── payment.entity.ts          # Entity Payment
├── dtos/
│   └── payment.dto.ts             # DTOs cho payment
├── services/
│   └── payment.service.ts         # Service xử lý thanh toán
├── controllers/
│   └── payment.controller.ts      # Controller API
├── modules/
│   └── payment.module.ts          # Module Payment
└── migrations/
    └── 1710669600003-CreatePaymentTable.ts
```

### Frontend (Next.js)

```
components/payment/
├── PaymentForm.tsx                # Form thanh toán
└── PaymentHistory.tsx             # Lịch sử thanh toán
services/
└── payment-api.ts                 # API service
```

## Cài đặt và cấu hình

### 1. Cài đặt dependencies

```bash
# Backend
cd codebase-admin
npm install @nestjs/config stripe @types/stripe

# Frontend
cd code_admin_fe
npm install @stripe/stripe-js
```

### 2. Cấu hình môi trường

Tạo file `.env` trong thư mục `codebase-admin`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=your_database

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Payment Gateway Configuration

# Stripe Configuration (Test Environment)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# VNPay Configuration (Test Environment)
VNPAY_TMN_CODE=test
VNPAY_HASH_SECRET=test
VNPAY_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/payment/vnpay/return
VNPAY_IPN_URL=http://localhost:3000/payments/webhook/vnpay

# MoMo Configuration (Test Environment)
MOMO_PARTNER_CODE=test
MOMO_ACCESS_KEY=test
MOMO_SECRET_KEY=test
MOMO_PAYMENT_URL=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_RETURN_URL=http://localhost:3000/payment/momo/return
MOMO_IPN_URL=http://localhost:3000/payments/webhook/momo

# ZaloPay Configuration (Test Environment)
ZALOPAY_APP_ID=test
ZALOPAY_KEY1=test
ZALOPAY_KEY2=test
ZALOPAY_PAYMENT_URL=https://sandbox.zalopay.com.vn/v001/tpe/createorder
ZALOPAY_RETURN_URL=http://localhost:3000/payment/zalopay/return
ZALOPAY_CALLBACK_URL=http://localhost:3000/payments/webhook/zalopay
```

### 3. Chạy migration

```bash
cd codebase-admin
npm run migration:run
```

## API Endpoints

### Tạo thanh toán
```
POST /payments/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 100000,
  "currency": "VND",
  "paymentMethod": "stripe",
  "description": "Payment for exam"
}
```

### Lấy thông tin thanh toán
```
GET /payments/:id
Authorization: Bearer <token>
```

### Lấy lịch sử thanh toán của user
```
GET /payments/user/:userId
Authorization: Bearer <token>
```

### Webhook endpoints
```
POST /payments/webhook/stripe
POST /payments/webhook/vnpay
POST /payments/webhook/momo
POST /payments/webhook/zalopay
```

## Sử dụng trong Frontend

### 1. Import components

```tsx
import { PaymentForm } from '@/components/payment/PaymentForm';
import { PaymentHistory } from '@/components/payment/PaymentHistory';
```

### 2. Sử dụng PaymentForm

```tsx
<PaymentForm
  defaultAmount={100000}
  description="Payment for exam"
  onPaymentSuccess={(payment) => {
    console.log('Payment successful:', payment);
  }}
  onPaymentError={(error) => {
    console.error('Payment failed:', error);
  }}
/>
```

### 3. Sử dụng PaymentHistory

```tsx
<PaymentHistory userId={currentUser.id} />
```

## Test các cổng thanh toán

### Stripe Test Cards

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

### VNPay Test

- Sử dụng sandbox environment
- Test với các mã giao dịch giả

### MoMo Test

- Sử dụng test environment
- Test với các tài khoản test

### ZaloPay Test

- Sử dụng sandbox environment
- Test với các app_id test

## Webhook Configuration

### Stripe Webhook

1. Tạo webhook trong Stripe Dashboard
2. URL: `https://your-domain.com/payments/webhook/stripe`
3. Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

### VNPay IPN

1. Cấu hình IPN URL trong VNPay Merchant
2. URL: `https://your-domain.com/payments/webhook/vnpay`

### MoMo IPN

1. Cấu hình IPN URL trong MoMo Partner
2. URL: `https://your-domain.com/payments/webhook/momo`

### ZaloPay Callback

1. Cấu hình Callback URL trong ZaloPay Partner
2. URL: `https://your-domain.com/payments/webhook/zalopay`

## Security Considerations

1. **Webhook Verification**: Luôn verify signature của webhook
2. **HTTPS**: Sử dụng HTTPS cho tất cả API endpoints
3. **Input Validation**: Validate tất cả input từ user
4. **Error Handling**: Xử lý lỗi một cách an toàn
5. **Logging**: Log tất cả giao dịch thanh toán

## Monitoring và Logging

### Payment Status Tracking

- `pending`: Thanh toán đang chờ xử lý
- `completed`: Thanh toán thành công
- `failed`: Thanh toán thất bại
- `refunded`: Thanh toán đã hoàn tiền
- `cancelled`: Thanh toán đã hủy

### Error Handling

- Log tất cả lỗi thanh toán
- Gửi notification cho admin khi có lỗi
- Retry mechanism cho các giao dịch thất bại

## Production Deployment

### 1. Environment Variables

- Sử dụng production keys cho các cổng thanh toán
- Cấu hình webhook URLs cho production
- Bật webhook signature verification

### 2. Database

- Backup database thường xuyên
- Monitor performance của payment queries
- Index các trường thường query

### 3. Security

- Sử dụng HTTPS
- Implement rate limiting
- Monitor suspicious activities
- Regular security audits

## Troubleshooting

### Common Issues

1. **Webhook không nhận được**: Kiểm tra URL và signature
2. **Payment status không update**: Kiểm tra webhook handler
3. **Database connection error**: Kiểm tra connection string
4. **CORS error**: Cấu hình CORS cho frontend

### Debug Tools

- Stripe CLI cho webhook testing
- VNPay sandbox cho test transactions
- Database logs cho payment tracking

## Support

- Stripe Documentation: https://stripe.com/docs
- VNPay Documentation: https://sandbox.vnpayment.vn/apis/docs/huong-dan-tich-hop
- MoMo Documentation: https://developers.momo.vn
- ZaloPay Documentation: https://docs.zalopay.vn 