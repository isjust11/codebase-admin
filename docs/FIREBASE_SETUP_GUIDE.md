# 🔥 Hướng dẫn Cấu hình Firebase Admin SDK

## 📋 Lỗi hiện tại

```
WARN [FcmService] FCM messaging not initialized. Skipping subscribeToTopic
```

**Nguyên nhân:** Thiếu hoặc cấu hình sai Firebase credentials trong file `.env`

## 🛠️ Cách sửa - Chi tiết từng bước

### Bước 1: Lấy Firebase Service Account Key

1. **Truy cập Firebase Console:**
   - Vào: https://console.firebase.google.com/
   - Chọn project của bạn

2. **Tạo Service Account Key:**
   - Click vào ⚙️ **Settings** (góc trên bên trái)
   - Chọn **Project settings**
   - Chuyển sang tab **Service accounts**
   - Click **Generate new private key**
   - Nhấn **Generate key** để download file JSON

3. **Mở file JSON vừa download:**
   ```json
   {
     "type": "service_account",
     "project_id": "your-project-id",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
     "client_id": "...",
     "auth_uri": "...",
     "token_uri": "...",
     "auth_provider_x509_cert_url": "...",
     "client_x509_cert_url": "..."
   }
   ```

### Bước 2: Cấu hình file .env

1. **Tạo hoặc mở file `.env`** ở thư mục root của project `codebase-admin`:

```bash
cd /Users/username/develops/base_app/codebase-admin
touch .env  # Tạo file nếu chưa có
```

2. **Thêm Firebase credentials vào `.env`:**

```env
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhki...(your full private key)...\n-----END PRIVATE KEY-----\n"
```

⚠️ **LƯU Ý QUAN TRỌNG:**
- `FIREBASE_PRIVATE_KEY` phải được đặt trong **dấu ngoặc kép**
- Giữ nguyên các ký tự `\n` trong private key
- Hoặc thay thế `\n` bằng xuống dòng thực nếu muốn

**Ví dụ cụ thể:**

```env
FIREBASE_PROJECT_ID=sotaynamduoc-app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-12345@sotaynamduoc-app.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

### Bước 3: Restart Server

Sau khi cấu hình xong, restart server để load environment variables mới:

```bash
# Nếu đang chạy npm run start:dev
# Nhấn Ctrl+C để stop, sau đó chạy lại:
npm run start:dev
```

### Bước 4: Kiểm tra Log

Khi server khởi động thành công, bạn sẽ thấy log:

```bash
✅ [FirebaseService] Firebase Admin initialized for FCM messaging
```

Thay vì:
```bash
❌ [FirebaseService] Firebase credentials are not fully configured. FCM will be disabled.
```

## 🧪 Testing

Sau khi cấu hình xong, test lại API:

```bash
curl -X POST http://localhost:4000/fcm-tokens/subscribe-topic \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"topic": "test"}'
```

Kết quả mong đợi:
```json
{
  "success": true,
  "data": {
    "successCount": 5,
    "failureCount": 0,
    "totalTokens": 5,
    "message": "Subscribed 5/5 tokens to topic: test"
  }
}
```

## 🔐 Bảo mật

⚠️ **QUAN TRỌNG:**

1. **KHÔNG commit file `.env` lên Git**
   - File `.env` đã được thêm vào `.gitignore`
   - KHÔNG bao giờ share private key công khai

2. **Tạo file `.env.example`** để team biết cần config gì:

```env
# .env.example
FIREBASE_PROJECT_ID=your-project-id-here
FIREBASE_CLIENT_EMAIL=your-client-email-here
FIREBASE_PRIVATE_KEY="your-private-key-here"
```

3. **Lưu trữ credentials an toàn:**
   - Sử dụng password manager
   - Hoặc lưu trong team documentation (riêng tư)
   - Không gửi qua email/chat

## 🚨 Troubleshooting

### 1. Lỗi: "Firebase credentials are not fully configured"

**Kiểm tra:**
```bash
# In ra environment variables để debug
node -e "console.log(process.env.FIREBASE_PROJECT_ID)"
```

Nếu trả về `undefined` → File `.env` chưa được load

**Giải pháp:**
- Đảm bảo file `.env` ở đúng thư mục root
- Restart server
- Kiểm tra cú pháp trong `.env`

### 2. Lỗi: "Failed to initialize Firebase Admin"

**Nguyên nhân:**
- Private key không đúng format
- Client email sai
- Project ID không tồn tại

**Giải pháp:**
- Download lại service account key từ Firebase Console
- Copy chính xác từ file JSON
- Không có khoảng trắng thừa

### 3. Private key có lỗi parsing

**Lỗi thường gặp:**
```
Error: error:0909006C:PEM routines:get_name:no start line
```

**Giải pháp:**
Đảm bảo private key có format đúng:

```env
# ✅ ĐÚNG - Với \n trong chuỗi
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIB...\n-----END PRIVATE KEY-----\n"

# ✅ ĐÚNG - Hoặc multiline với dấu ngoặc kép
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIB...
-----END PRIVATE KEY-----
"

# ❌ SAI - Thiếu dấu ngoặc kép
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...

# ❌ SAI - Thiếu \n hoặc xuống dòng
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----MIIEvQIB...-----END PRIVATE KEY-----"
```

## 📚 Tham khảo

- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Service Account Keys](https://cloud.google.com/iam/docs/creating-managing-service-account-keys)
- [Environment Variables in Node.js](https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs)

