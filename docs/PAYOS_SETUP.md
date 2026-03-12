# Hướng dẫn sửa lỗi tích hợp PayOS

Dựa trên [tài liệu chính thức PayOS](https://payos.vn/docs/sdks/back-end/node/) và package `@payos/node` v2.x.

---

## 1. Các lỗi thường gặp và cách khắc phục

### 1.1. Constructor PayOS — sai format tham số

**Vấn đề:** SDK v2 dùng object config, không dùng tham số vị trí.

**Code cũ (sai):**
```ts
this.payos = new PayOS(
  this.configService.get<string>('PAYOS_CLIENT_ID', ''),
  this.configService.get<string>('PAYOS_API_KEY', ''),
  this.configService.get<string>('PAYOS_CHECKSUM_KEY', ''),
);
```

**Code đúng:**
```ts
this.payos = new PayOS({
  clientId: this.configService.get<string>('PAYOS_CLIENT_ID', ''),
  apiKey: this.configService.get<string>('PAYOS_API_KEY', ''),
  checksumKey: this.configService.get<string>('PAYOS_CHECKSUM_KEY', ''),
});
```

---

### 1.2. Tạo link thanh toán — sai method

**Vấn đề:** SDK v2 dùng `paymentRequests.create()`, không còn `createPaymentLink()`.

**Code cũ (sai):**
```ts
const paymentLinkRes = await this.payos.createPaymentLink(body);
```

**Code đúng:**
```ts
const paymentLinkRes = await this.payos.paymentRequests.create(body);
```

---

### 1.3. Thiếu trường `items` bắt buộc

**Vấn đề:** PayOS v2 yêu cầu mảng `items` với `name`, `quantity`, `price`.

**Code đúng:**
```ts
const body = {
  orderCode: params.orderCode,
  amount: params.amount,
  description: params.description.substring(0, 50),
  items: [
    {
      name: params.description.substring(0, 127) || 'Thanh toán',
      quantity: 1,
      price: params.amount,
    },
  ],
  returnUrl: params.returnUrl,
  cancelUrl: params.cancelUrl,
};
```

---

### 1.4. Verify webhook — sai method

**Vấn đề:** SDK v2 dùng `webhooks.verify()`, không còn `verifyPaymentWebhookData()`.

**Code cũ (sai):**
```ts
return this.payos.verifyPaymentWebhookData(webhookData);
```

**Code đúng:**
```ts
return this.payos.webhooks.verify(webhookData);
```

---

### 1.5. `orderCode` phải là số nguyên

**Vấn đề:** `orderCode` phải là số nguyên 6–19 chữ số, không trùng nhau.

- Dùng `payment.id` (number) thay vì UUID
- Hoặc: `parseInt(hashCode(uuid).substring(0, 15), 10)` để tạo số từ UUID
- Tránh số quá nhỏ hoặc quá lớn ngoài khoảng cho phép

---

## 2. Cấu hình biến môi trường

Thêm vào file `.env`:

```env
# PayOS (lấy từ kênh thanh toán https://payos.vn)
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key
```

**Kiểm tra:**
- Không có khoảng trắng thừa
- Không có dấu nháy
- Đúng key từ PayOS Dashboard

---

## 3. Cấu hình Webhook URL

1. Đăng nhập [PayOS Dashboard](https://merchant.payos.vn)
2. Vào **Cài đặt kênh** → **Webhook**
3. URL: `https://your-domain.com/payment/payos/webhook`
4. Lưu ý: URL phải public, HTTPS trong production
5. Dùng ngrok khi test local: `https://xxx.ngrok.io/payment/payos/webhook`

---

## 4. Cấu trúc response webhook sau khi verify

Sau khi `webhooks.verify()` thành công, dữ liệu thường có:

- `orderCode` — mã đơn (tương ứng `payment.id`)
- `code` — mã trạng thái (`'00'` = thành công)
- `amount` — số tiền
- `transactionDateTime` — thời gian giao dịch
- `data.reference` — mã tham chiếu giao dịch

---

## 5. Checklist xử lý lỗi

| Lỗi | Kiểm tra |
|-----|----------|
| `PayOS is not a constructor` | Cài `@payos/node` phiên bản mới, import đúng |
| `createPaymentLink is not a function` | Dùng `paymentRequests.create()` |
| `Invalid signature` / webhook fail | Đúng `checksumKey`, không sửa body trước khi verify |
| `orderCode invalid` | Số nguyên 6–19 chữ số, không trùng |
| `items is required` | Thêm mảng `items` với name, quantity, price |
| Không có link thanh toán | Kiểm tra `PAYOS_CLIENT_ID`, `PAYOS_API_KEY` |

---

## 6. Tài liệu tham khảo

- [PayOS Node SDK](https://payos.vn/docs/sdks/back-end/node/)
- [GitHub @payos/node](https://github.com/payOSHQ/payos-lib-node)
- [Demo NodeJS](https://github.com/payOSHQ/payos-demo-nodejs)
