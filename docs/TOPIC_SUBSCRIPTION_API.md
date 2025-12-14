# 📡 Topic Subscription API Endpoints

## 🔐 Authentication
Tất cả endpoints yêu cầu JWT token trong header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 👤 User Endpoints

### 1. Subscribe to Topic
Subscribe user hiện tại vào một topic.

```http
POST /topic-subscriptions/subscribe
Content-Type: application/json
Authorization: Bearer <token>

{
  "topic": "topic-article"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully subscribed to topic: topic-article",
  "data": {
    "subscription": {
      "id": 1,
      "userId": 123,
      "topic": "topic-article",
      "isActive": true,
      "createdAt": "2025-12-12T00:00:00.000Z"
    },
    "fcm": {
      "successCount": 2,
      "failureCount": 0,
      "totalTokens": 2,
      "message": "Subscribed 2/2 tokens to topic: topic-article"
    }
  }
}
```

---

### 2. Unsubscribe from Topic
Hủy subscribe khỏi một topic.

```http
POST /topic-subscriptions/unsubscribe
Content-Type: application/json
Authorization: Bearer <token>

{
  "topic": "topic-article"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully unsubscribed from topic: topic-article",
  "data": {
    "fcm": {
      "successCount": 2,
      "failureCount": 0,
      "totalTokens": 2
    }
  }
}
```

---

### 3. Get My Topics
Xem danh sách topics đang subscribe.

```http
GET /topic-subscriptions/my-topics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    "topic-article",
    "topic-folk-medicine",
    "topic-news"
  ],
  "count": 3
}
```

---

### 4. Check Subscription Status
Kiểm tra xem có đang subscribe topic không.

```http
GET /topic-subscriptions/check/topic-article
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "topic": "topic-article",
    "isSubscribed": true
  }
}
```

---

### 5. Get Available Topics
Lấy danh sách tất cả topics có thể subscribe.

```http
GET /topic-subscriptions/available-topics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "topic-article",
      "name": "Bài viết mới",
      "description": "Nhận thông báo khi có bài viết mới",
      "icon": "📝",
      "category": "content"
    },
    {
      "id": "topic-folk-medicine",
      "name": "Bài thuốc dân gian",
      "description": "Nhận thông báo về bài thuốc dân gian mới",
      "icon": "🌿",
      "category": "content"
    },
    {
      "id": "topic-news",
      "name": "Tin tức",
      "description": "Tin tức và cập nhật mới nhất",
      "icon": "📰",
      "category": "news"
    }
  ]
}
```

---

### 6. Batch Subscribe
Subscribe nhiều topics cùng lúc.

```http
POST /topic-subscriptions/batch-subscribe
Content-Type: application/json
Authorization: Bearer <token>

{
  "topics": [
    "topic-article",
    "topic-folk-medicine",
    "topic-news"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscribed to 3/3 topics",
  "data": [
    { "topic": "topic-article", "success": true },
    { "topic": "topic-folk-medicine", "success": true },
    { "topic": "topic-news", "success": true }
  ]
}
```

---

## 👨‍💼 Admin Endpoints

### 7. Get Topic Statistics
Xem thống kê của một topic.

**Permission Required:** `READ notification`

```http
GET /topic-subscriptions/admin/stats/topic-article
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "topic": "topic-article",
    "totalSubscriptions": 1000,
    "activeSubscriptions": 850,
    "inactiveSubscriptions": 150
  }
}
```

---

### 8. Get All Topics Stats
Xem thống kê tất cả topics.

**Permission Required:** `READ notification`

```http
GET /topic-subscriptions/admin/stats
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "topic": "topic-article",
      "totalSubscriptions": 1000,
      "activeSubscriptions": 850,
      "inactiveSubscriptions": 150
    },
    {
      "topic": "topic-folk-medicine",
      "totalSubscriptions": 750,
      "activeSubscriptions": 680,
      "inactiveSubscriptions": 70
    }
  ]
}
```

---

### 9. Get Topic Subscribers
Xem danh sách users subscribe một topic.

**Permission Required:** `READ notification`

```http
GET /topic-subscriptions/admin/subscribers/topic-article?page=1&size=20
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "topic": "topic-article",
    "userIds": [1, 5, 10, 25, 50, ...],
    "pagination": {
      "page": 1,
      "size": 20,
      "total": 850,
      "totalPages": 43
    }
  }
}
```

---

### 10. Force Subscribe User
Admin ép subscribe một user vào topic.

**Permission Required:** `CREATE notification`

```http
POST /topic-subscriptions/admin/force-subscribe
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "userId": 123,
  "topic": "topic-article"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Force subscribed user 123 to topic: topic-article",
  "data": {
    "id": 456,
    "userId": 123,
    "topic": "topic-article",
    "isActive": true
  }
}
```

---

### 11. Force Unsubscribe User
Admin ép unsubscribe một user khỏi topic.

**Permission Required:** `DELETE notification`

```http
POST /topic-subscriptions/admin/force-unsubscribe
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "userId": 123,
  "topic": "topic-article"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Force unsubscribed user 123 from topic: topic-article"
}
```

---

## 📱 Mobile App Integration

### Flutter Example

```dart
class TopicService {
  final ApiClient _apiClient;
  
  // Subscribe to topic
  Future<void> subscribeToTopic(String topic) async {
    try {
      // 1. Subscribe FCM token locally
      await FirebaseMessaging.instance.subscribeToTopic(topic);
      
      // 2. Notify backend
      final response = await _apiClient.post(
        '/topic-subscriptions/subscribe',
        data: {'topic': topic},
      );
      
      if (response.data['success']) {
        print('✅ Subscribed to $topic');
      }
    } catch (e) {
      print('❌ Error subscribing: $e');
    }
  }
  
  // Get my topics
  Future<List<String>> getMyTopics() async {
    final response = await _apiClient.get('/topic-subscriptions/my-topics');
    return List<String>.from(response.data['data']);
  }
  
  // Check if subscribed
  Future<bool> isSubscribed(String topic) async {
    final response = await _apiClient.get(
      '/topic-subscriptions/check/$topic'
    );
    return response.data['data']['isSubscribed'];
  }
}
```

---

## 🎨 Frontend Admin Integration

### React/Next.js Example

```typescript
// services/topicSubscriptionService.ts
export class TopicSubscriptionService {
  // Get all topics stats
  async getAllTopicsStats() {
    const response = await api.get('/topic-subscriptions/admin/stats');
    return response.data.data;
  }
  
  // Get topic subscribers with pagination
  async getTopicSubscribers(topic: string, page: number = 1) {
    const response = await api.get(
      `/topic-subscriptions/admin/subscribers/${topic}`,
      { params: { page, size: 20 } }
    );
    return response.data.data;
  }
  
  // Force subscribe user
  async forceSubscribe(userId: number, topic: string) {
    const response = await api.post(
      '/topic-subscriptions/admin/force-subscribe',
      { userId, topic }
    );
    return response.data;
  }
}
```

---

## 🧪 cURL Examples

### Subscribe to Topic
```bash
curl -X POST http://localhost:4000/topic-subscriptions/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"topic": "topic-article"}'
```

### Get My Topics
```bash
curl -X GET http://localhost:4000/topic-subscriptions/my-topics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Topic Stats (Admin)
```bash
curl -X GET http://localhost:4000/topic-subscriptions/admin/stats/topic-article \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## ⚠️ Error Responses

### Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Forbidden (Missing Permission)
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

### Bad Request
```json
{
  "statusCode": 400,
  "message": "Topic is required",
  "error": "Bad Request"
}
```

---

## 📊 Available Topics

| Topic ID | Name | Description | Category |
|----------|------|-------------|----------|
| `topic-article` | Bài viết mới | Thông báo bài viết mới | content |
| `topic-folk-medicine` | Bài thuốc dân gian | Bài thuốc mới | content |
| `topic-news` | Tin tức | Tin tức mới nhất | news |
| `topic-updates` | Cập nhật hệ thống | Bảo trì, updates | system |
| `topic-promotions` | Khuyến mãi | Ưu đãi, khuyến mãi | marketing |

---

## 🔄 Workflow

### User Subscribe Flow:
```
1. User clicks "Subscribe to Articles" in app
2. App calls: POST /topic-subscriptions/subscribe
3. Backend:
   - Subscribe FCM tokens via Firebase
   - Create topic_subscription record
4. User receives notifications when articles are created
5. Backend creates individual notification for user
```

### Admin Force Subscribe Flow:
```
1. Admin selects user and topic
2. Admin calls: POST /topic-subscriptions/admin/force-subscribe
3. Backend subscribes user's tokens and creates record
4. User starts receiving notifications
```

---

## 💡 Best Practices

1. **Check subscription before subscribing:**
   ```typescript
   const isSubscribed = await checkSubscription('topic-article');
   if (!isSubscribed) {
     await subscribe('topic-article');
   }
   ```

2. **Batch operations for better UX:**
   ```typescript
   // When user first opens app
   await batchSubscribe([
     'topic-article',
     'topic-news',
     'topic-updates'
   ]);
   ```

3. **Handle errors gracefully:**
   ```typescript
   try {
     await subscribe('topic-article');
   } catch (error) {
     if (error.response?.status === 401) {
       // Redirect to login
     } else {
       // Show error message
     }
   }
   ```

---

*Last updated: December 12, 2025*

