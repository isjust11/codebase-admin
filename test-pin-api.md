# Test API Verify PIN

## Endpoints đã tạo:

### 1. POST /auth/register
- Tạo tài khoản mới và gửi mã PIN 4 số qua email
- Response sẽ bao gồm mã PIN để test (trong production nên bỏ)

### 2. POST /auth/verify-pin
- Xác thực mã PIN
- Body: `{"email": "user@example.com", "pin": "1234"}`

### 3. POST /auth/resend-pin
- Gửi lại mã PIN mới
- Body: `{"email": "user@example.com"}`

## Test với curl:

```bash
# 1. Đăng ký tài khoản
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "123456",
    "fullName": "Test User",
    "phone": "0123456789"
  }'

# 2. Xác thực PIN (sử dụng PIN từ response của register)
curl -X POST http://localhost:4000/auth/verify-pin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "pin": "1234"
  }'

# 3. Gửi lại PIN
curl -X POST http://localhost:4000/auth/resend-pin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

## Database Migration:
- Đã tạo migration file: `1751353000000-AddPinFieldsToUser.ts`
- Thêm fields: `pinCode` và `pinExpiresAt` vào bảng `user`

## Flutter App:
- AuthCubit đã có methods: `verifyPin()` và `resendPin()`
- AuthRepository và AuthRemoteDataSource đã được cập nhật
- ConfirmPinScreen đã sẵn sàng sử dụng API mới
