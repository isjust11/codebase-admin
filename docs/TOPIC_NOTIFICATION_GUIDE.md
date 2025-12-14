# 📨 Topic Notification với Individual User Tracking

## Vấn đề

Khi gửi notification theo **topic** (ví dụ: `topic-article`), FCM sẽ gửi đến tất cả devices đã subscribe topic đó. Tuy nhiên, làm sao để:
1. Biết user nào đã nhận được notification?
2. Lưu notification vào **notification history** của từng user?
3. Track notification status (read/unread) cho từng user?

## Giải pháp

Tạo **Topic Subscription Tracking System** để:
- Track user nào subscribe topic nào
- Tự động tạo notification records cho từng user khi gửi theo topic

---

## 🏗️ Architecture

### 1. Database Schema

```sql
-- Bảng mới: topic_subscriptions
CREATE TABLE topic_subscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  topic VARCHAR(255) NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  UNIQUE KEY idx_user_topic (userId, topic),
  KEY idx_userId (userId),
  KEY idx_topic (topic)
);
```

### 2. Flow Diagram

```
User Subscribe Topic
       ↓
FCM Token Subscribe → Firebase FCM
       ↓
TopicSubscription Record Created → Database
       ↓
When Notification Sent to Topic
       ↓
1. Send via FCM → All Devices
2. Query Subscribed Users → Database
3. Create Individual Notifications → For Each User
```

---

## 📝 Usage Examples

### 1. Gửi Notification theo Topic

**Before (❌ Chỉ tạo 1 notification chung):**
```typescript
// article.service.ts
const sendResult = await this.fcmService.sendToTopic('topic-article', {
  title: 'Có bài viết mới',
  body: article.title,
});

if (sendResult) {
  // ❌ Chỉ tạo 1 notification, không có userId
  this.notificationService.newNotification(
    NotificationType.NEW_ARTICLE,
    savedArticle,
    'Có bài viết mới',
    article.title
  );
}
```

**After (✅ Tạo notification cho từng user):**
```typescript
// article.service.ts
const topicName = 'topic-article';
const sendResult = await this.fcmService.sendToTopic(topicName, {
  title: 'Có bài viết mới',
  body: article.title,
  data: { articleId: article.id.toString() }
});

if (sendResult) {
  // ✅ Lấy danh sách users đã subscribe
  const subscribedUserIds = await this.topicSubscriptionService
    .getUserIdsByTopic(topicName);
  
  if (subscribedUserIds.length > 0) {
    // ✅ Tạo notification cho từng user
    await this.notificationService.createNotificationsForUsers(
      subscribedUserIds,
      NotificationType.NEW_ARTICLE,
      savedArticle,
      'Có bài viết mới',
      article.title
    );
    
    console.log(`Created ${subscribedUserIds.length} notifications`);
  }
}
```

---

### 2. Subscribe User to Topic

```typescript
// fcm-token.service.ts
const result = await fcmTokenService.subscribeTopic('topic-article', userId);

// Tự động:
// 1. Subscribe FCM tokens → Firebase
// 2. Create topic_subscription record → Database
```

---

### 3. Unsubscribe User from Topic

```typescript
const result = await fcmTokenService.unsubscribeTopic('topic-article', userId);

// Tự động:
// 1. Unsubscribe FCM tokens → Firebase
// 2. Mark topic_subscription as inactive → Database
```

---

### 4. Query User's Notifications

```typescript
// Bây giờ có thể query notifications của user
const notifications = await notificationRepository.find({
  where: { userId: 123 },
  order: { createdAt: 'DESC' }
});

// Mỗi user sẽ có notification riêng với status riêng
```

---

## 🔧 API Endpoints

### Subscribe to Topic

```bash
POST /fcm-tokens/subscribe-topic
Authorization: Bearer <token>

{
  "topic": "topic-article"
}

Response:
{
  "successCount": 2,
  "failureCount": 0,
  "totalTokens": 2,
  "message": "Subscribed 2/2 tokens to topic: topic-article"
}
```

### Unsubscribe from Topic

```bash
POST /fcm-tokens/unsubscribe-topic
Authorization: Bearer <token>

{
  "topic": "topic-article"
}
```

### Get User's Subscribed Topics

```typescript
// topicSubscriptionService.getTopicsByUserId(userId)
const topics = await topicSubscriptionService.getTopicsByUserId(123);
// Returns: ['topic-article', 'topic-news', 'topic-updates']
```

### Get Topic Statistics

```typescript
const stats = await topicSubscriptionService.getTopicStats('topic-article');

// Returns:
{
  topic: 'topic-article',
  totalSubscriptions: 1000,
  activeSubscriptions: 850,
  inactiveSubscriptions: 150
}
```

---

## 🎯 Benefits

### ✅ Trước khi có Topic Tracking:
- ❌ Không biết ai nhận notification
- ❌ Không có notification history cho user
- ❌ Không track được read/unread status
- ❌ Không query được "notifications của tôi"

### ✅ Sau khi có Topic Tracking:
- ✅ Biết chính xác ai subscribe topic nào
- ✅ Mỗi user có notification history riêng
- ✅ Track được status cho từng user
- ✅ Query được notifications theo userId
- ✅ Có thể delete/mark as read cho từng user
- ✅ Analytics: biết notification nào được đọc nhiều nhất

---

## 📊 Database Queries

### Get all notifications for a user:
```sql
SELECT * FROM notification 
WHERE userId = 123 
ORDER BY createdAt DESC;
```

### Get unread notifications count:
```sql
SELECT COUNT(*) FROM notification 
WHERE userId = 123 AND status = 'UNREAD';
```

### Get users subscribed to a topic:
```sql
SELECT userId FROM topic_subscriptions 
WHERE topic = 'topic-article' AND isActive = TRUE;
```

### Get topics a user is subscribed to:
```sql
SELECT topic FROM topic_subscriptions 
WHERE userId = 123 AND isActive = TRUE;
```

---

## 🔄 Migration Steps

### 1. Run Migration
```bash
npm run typeorm:run-migrations
```

### 2. Populate Existing Subscriptions (Optional)
Nếu đã có users đang subscribe topics, cần migrate data:

```typescript
// scripts/migrate-topic-subscriptions.ts
import { FcmToken } from '../entities/fcm-token.entity';
import { TopicSubscriptionService } from '../services/topic-subscription.service';

async function migrateExistingSubscriptions() {
  // Giả sử tất cả active users đang subscribe 'topic-article'
  const activeUsers = await fcmTokenRepo
    .createQueryBuilder('token')
    .select('DISTINCT token.userId')
    .where('token.isActive = true')
    .getRawMany();
  
  for (const { userId } of activeUsers) {
    await topicSubscriptionService.subscribe(userId, 'topic-article');
  }
  
  console.log(`Migrated ${activeUsers.length} users`);
}
```

---

## 🚀 Next Steps

### 1. Update Mobile App
Mobile app cần track subscriptions:

```dart
// Flutter
Future<void> subscribeToArticles() async {
  // 1. Subscribe FCM
  await fcmService.subscribeToTopic('topic-article');
  
  // 2. Notify backend
  await apiService.subscribeToTopic('topic-article');
}
```

### 2. Add UI for Topic Management
Cho phép user chọn topics muốn subscribe:

```typescript
// Topic list UI
const topics = [
  { id: 'topic-article', name: 'Bài viết mới', icon: '📝' },
  { id: 'topic-news', name: 'Tin tức', icon: '📰' },
  { id: 'topic-updates', name: 'Cập nhật', icon: '🔔' },
];
```

### 3. Analytics Dashboard
Track notification performance:
- Delivery rate per topic
- Open rate per topic
- Active subscribers per topic

---

## ⚠️ Important Notes

1. **Performance:** Query `getUserIdsByTopic()` có thể chậm nếu có nhiều subscribers. Consider:
   - Add caching (Redis)
   - Batch processing
   - Background jobs

2. **Consistency:** Đảm bảo sync giữa:
   - Firebase FCM subscriptions
   - Database topic_subscriptions records

3. **Cleanup:** Định kỳ cleanup inactive subscriptions:
   ```typescript
   // Xóa subscriptions của users đã uninstall app
   DELETE FROM topic_subscriptions 
   WHERE userId NOT IN (
     SELECT DISTINCT userId FROM fcm_token WHERE isActive = TRUE
   );
   ```

---

## 📚 Related Files

- `src/entities/topic-subscription.entity.ts` - Entity definition
- `src/services/topic-subscription.service.ts` - Service logic
- `src/services/notification.service.ts` - Notification creation
- `src/services/fcm-token.service.ts` - Topic subscribe/unsubscribe
- `src/services/article.service.ts` - Example usage
- `src/migrations/1734000000000-CreateTopicSubscriptionTable.ts` - Migration

---

*Last updated: December 12, 2025*

