# FCM Topic Subscription - Hướng dẫn Chi tiết

## 📋 Tổng quan

Hệ thống FCM (Firebase Cloud Messaging) cho phép subscribe/unsubscribe các FCM tokens vào/ra khỏi các topics để gửi notification theo nhóm.

## 🏗️ Kiến trúc

### 1. **FcmService** (`src/services/fcm.service.ts`)
Service chính xử lý việc giao tiếp với Firebase Admin SDK.

#### Methods:
- `subscribeToTopic(tokens: string[], topic: string)` - Subscribe nhiều tokens vào một topic
- `unsubscribeFromTopic(tokens: string[], topic: string)` - Unsubscribe nhiều tokens khỏi một topic
- `sendToTopic(topic: string, payload)` - Gửi notification đến một topic
- `sendToToken(token: string, payload)` - Gửi notification đến một token
- `sendToTokens(tokens: string[], payload)` - Gửi notification đến nhiều tokens

### 2. **FcmTokenService** (`src/services/fcm-token.service.ts`)
Service quản lý FCM tokens trong database và điều phối việc subscribe/unsubscribe.

#### Methods:
- `subscribeTopic(topic: string, userId?: number)` - Subscribe tất cả active tokens (hoặc chỉ của user) vào topic
- `unsubscribeTopic(topic: string, userId?: number)` - Unsubscribe tất cả active tokens (hoặc chỉ của user) khỏi topic
- `subscribeTokensToTopic(tokens: string[], topic: string)` - Subscribe các tokens cụ thể vào topic
- `unsubscribeTokensFromTopic(tokens: string[], topic: string)` - Unsubscribe các tokens cụ thể khỏi topic

### 3. **FcmTokenController** (`src/controllers/notification/fcm-token.controller.ts`)
Controller cung cấp API endpoints cho client.

## 🔄 Luồng hoạt động

### Subscribe to Topic:

```
Client → Controller → FcmTokenService → Database (get active tokens) → FcmService → Firebase Admin SDK
```

1. **Client** gọi API: `POST /fcm-tokens/subscribe-topic`
   ```json
   {
     "topic": "news"
   }
   ```

2. **Controller** nhận request và gọi service

3. **FcmTokenService**:
   - Query database lấy tất cả active FCM tokens
   - Trích xuất token strings
   - Gọi FcmService.subscribeToTopic()

4. **FcmService**:
   - Kiểm tra Firebase Admin SDK đã khởi tạo chưa
   - Gọi `messaging.subscribeToTopic(tokens, topic)` của Firebase Admin SDK
   - Log kết quả (success/failure count)

5. **Firebase Admin SDK**:
   - Subscribe các tokens vào topic trên Firebase servers
   - Trả về kết quả với successCount, failureCount, errors

6. **Response** trả về client:
   ```json
   {
     "successCount": 15,
     "failureCount": 1,
     "totalTokens": 16,
     "message": "Subscribed 15/16 tokens to topic: news",
     "errors": []
   }
   ```

### Unsubscribe from Topic:

Tương tự như Subscribe nhưng:
- Endpoint: `POST /fcm-tokens/unsubscribe-topic`
- Gọi `messaging.unsubscribeFromTopic(tokens, topic)`

## 📊 Database Schema

```sql
FcmToken {
  id: number (PK)
  token: string (unique index)
  userId: number (nullable)
  deviceId: string (nullable)
  platform: string (ios | android | web)
  isActive: boolean (default: true)
  createdAt: timestamp
  updatedAt: timestamp
}
```

## 🔑 Key Points

### ✅ Điều GHI NHỚ:

1. **Topic subscription được quản lý bởi Firebase**, KHÔNG phải database
   - Database CHỈ lưu trữ FCM tokens
   - Firebase Admin SDK quản lý việc subscribe/unsubscribe

2. **Không cần lưu topic subscription vào database**
   - Firebase tự động quản lý mapping giữa tokens và topics
   - Khi gửi message đến topic, Firebase tự động biết gửi đến tokens nào

3. **Subscribe/Unsubscribe là idempotent**
   - Subscribe một token đã subscribe → Không có lỗi
   - Unsubscribe một token chưa subscribe → Không có lỗi

4. **Batch operations**
   - Firebase Admin SDK hỗ trợ subscribe/unsubscribe nhiều tokens cùng lúc
   - Limit: tối đa 1000 tokens/request

### ❌ SAI LẦM thường gặp:

1. ❌ **Cố gắng lưu topic subscription vào database**
   ```typescript
   // SAI - Không cần làm như này
   await this.fcmRepo.update({ topic: topic }, { isSubscribed: true });
   ```

2. ❌ **Sử dụng token như topic**
   ```typescript
   // SAI - Code cũ
   this.fcmRepo.update({ token: topic }, { isActive: true });
   ```

3. ❌ **Quên check Firebase Admin SDK đã init chưa**
   ```typescript
   // SAI - Có thể gây lỗi nếu Firebase chưa init
   await messaging.subscribeToTopic(tokens, topic);
   
   // ĐÚNG - Check trước
   if (!messaging) {
     this.logger.warn('FCM not initialized');
     return null;
   }
   ```

## 🧪 Testing

### 1. Subscribe to Topic:
```bash
curl -X POST http://localhost:3000/fcm-tokens/subscribe-topic \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"topic": "news"}'
```

### 2. Unsubscribe from Topic:
```bash
curl -X POST http://localhost:3000/fcm-tokens/unsubscribe-topic \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"topic": "news"}'
```

### 3. Send to Topic:
```bash
curl -X POST http://localhost:3000/notifications/fcm/send-topic \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "topic": "news",
    "title": "Breaking News",
    "body": "This is a test notification",
    "data": {"type": "news", "id": "123"}
  }'
```

## 🔐 Permissions Required

Tất cả endpoints yêu cầu:
- **Authentication**: JwtAuthGuard
- **Permission**: `CREATE` on `fcm_token`

## 📝 Environment Variables

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
```

## 🚨 Error Handling

### Common Errors:

1. **Firebase not initialized**
   - Kiểm tra env variables
   - Check logs: "Firebase Admin initialized for FCM messaging"

2. **Invalid tokens**
   - Tokens có thể expire hoặc invalid
   - Firebase sẽ trả về trong errors array

3. **Topic name invalid**
   - Topic name phải match pattern: `[a-zA-Z0-9-_.~%]+`
   - Max length: 900 characters

## 🎯 Use Cases

### 1. Subscribe tất cả users vào topic "all":
```typescript
await fcmTokenService.subscribeTopic('all');
```

### 2. Subscribe chỉ tokens của user cụ thể:
```typescript
await fcmTokenService.subscribeTopic('premium_users', userId);
```

### 3. Subscribe tokens cụ thể:
```typescript
const tokens = ['token1', 'token2', 'token3'];
await fcmTokenService.subscribeTokensToTopic(tokens, 'vip');
```

### 4. Gửi notification đến topic:
```typescript
await fcmService.sendToTopic('news', {
  title: 'Breaking News',
  body: 'New article published',
  data: { articleId: '123' }
});
```

## 📚 References

- [Firebase Admin SDK - Topic Management](https://firebase.google.com/docs/cloud-messaging/admin/manage-topic-subscriptions)
- [FCM Topics Overview](https://firebase.google.com/docs/cloud-messaging/android/topic-messaging)

