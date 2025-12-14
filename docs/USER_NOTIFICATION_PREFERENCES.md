# User Notification Preferences

## 📝 Tổng quan

Hệ thống `NotificationConfig` giờ đã hỗ trợ **User-specific configurations** - cho phép mỗi user tự cấu hình cách nhận/gửi thông báo của riêng họ.

## 🎯 Cơ chế hoạt động

### Priority System (Thứ tự ưu tiên)

Khi lấy giá trị config, hệ thống sẽ áp dụng theo thứ tự:

```
User Config > Global Config > Default Value
```

**Ví dụ:**
- User 123 có config riêng: `max_notifications_per_hour = 100`
- Global config: `max_notifications_per_hour = 50`
- User 456 không có config riêng
  
→ User 123 nhận max 100 notifications/hour  
→ User 456 nhận max 50 notifications/hour (global)

---

## 🗄️ Database Schema

```sql
CREATE TABLE notification_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NULL,                    -- NULL = Global, Number = User-specific
  `key` VARCHAR(255) NOT NULL,
  value TEXT NULL,
  jsonValue JSON NULL,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_userId (userId),
  UNIQUE INDEX idx_userId_key (userId, `key`)
);
```

**Lưu ý:** Composite unique index `(userId, key)` cho phép:
- ✅ Cùng một `key` có nhiều records với `userId` khác nhau
- ✅ Cùng một `key` có 1 global config (`userId = NULL`)
- ❌ Không được duplicate `(userId, key)`

---

## 💻 API Usage

### 1. **Lấy config với user override**

```typescript
// Backend Service
const value = await notificationConfigService.getConfigValue(
  'max_notifications_per_hour',  // key
  123,                            // userId (optional)
  50                              // default value
);
```

### 2. **Lấy danh sách config của user cụ thể**

```typescript
// GET /notification-configs?userId=123
const configs = await notificationConfigService.findPagination(
  1,      // page
  10,     // size
  '',     // search
  123     // userId
);
```

### 3. **Lấy config của current user**

```typescript
// GET /notification-configs/my-configs
// Tự động lấy userId từ authenticated user
```

### 4. **Tạo config cho user cụ thể**

```typescript
// Backend
await notificationConfigService.create({
  userId: 123,
  key: 'enable_email_notifications',
  value: 'false',
  isActive: true
});
```

### 5. **Tạo global config**

```typescript
// Backend - để userId = null hoặc undefined
await notificationConfigService.create({
  userId: null,  // hoặc không truyền userId
  key: 'default_notification_sound',
  value: 'notification.mp3',
  isActive: true
});
```

---

## 🎨 Frontend Usage

### **Tạo config trong Admin UI**

1. Vào **Manager > Notification Configs**
2. Click **"Thêm cấu hình"**
3. **User ID:**
   - Để trống = Global config (áp dụng cho tất cả user)
   - Nhập số = Config riêng cho user đó

### **Xem config theo user**

Trong danh sách, mỗi config sẽ hiển thị:
- 🟣 **Global** badge - Config áp dụng cho tất cả
- 🔵 **User {id}** badge - Config riêng cho user cụ thể

---

## 📚 Use Cases

### 1. **Notification Frequency Limit**

```javascript
// Global: Tất cả user max 50/hour
{
  userId: null,
  key: "max_notifications_per_hour",
  value: "50"
}

// User 123: VIP user max 200/hour
{
  userId: 123,
  key: "max_notifications_per_hour",
  value: "200"
}
```

### 2. **Quiet Hours**

```javascript
// Global: Quiet hours 22:00 - 07:00
{
  userId: null,
  key: "quiet_hours",
  jsonValue: {
    "start": "22:00",
    "end": "07:00",
    "enabled": true
  }
}

// User 456: Override - Không có quiet hours
{
  userId: 456,
  key: "quiet_hours",
  jsonValue: {
    "enabled": false
  }
}
```

### 3. **Notification Channels**

```javascript
// Global: Bật tất cả channels
{
  userId: null,
  key: "enabled_channels",
  jsonValue: {
    "push": true,
    "email": true,
    "sms": true
  }
}

// User 789: Chỉ nhận push, tắt email & SMS
{
  userId: 789,
  key: "enabled_channels",
  jsonValue: {
    "push": true,
    "email": false,
    "sms": false
  }
}
```

### 4. **Topic Subscriptions**

```javascript
// User có thể subscribe/unsubscribe topics riêng
{
  userId: 101,
  key: "subscribed_topics",
  jsonValue: ["new_articles", "folk_medicine", "herbal"]
}

{
  userId: 102,
  key: "subscribed_topics",
  jsonValue: ["system_alerts"]
}
```

---

## 🔧 Service Helper Methods

### **findByKeyAndUser**
Tìm config theo key và userId cụ thể

```typescript
const config = await service.findByKeyAndUser(
  'enable_push_notifications',
  123
);
```

### **getConfigValue**
Lấy giá trị config với priority system

```typescript
// Priority: User 123 config > Global > Default
const value = await service.getConfigValue(
  'notification_sound',
  123,              // userId
  'default.mp3'     // default value
);
```

---

## 🚀 Migration Guide

### 1. Chạy migration SQL

```bash
mysql -u username -p database_name < src/migrations/add-userid-to-notification-config.sql
```

### 2. Restart backend server

```bash
npm run start
```

### 3. Deploy frontend

```bash
cd codebase_admin_fe
npm run build
```

---

## ⚠️ Important Notes

1. **Unique Constraint:**  
   Mỗi user chỉ có thể có 1 config duy nhất cho 1 key  
   ✅ OK: `(userId=123, key='sound')` và `(userId=456, key='sound')`  
   ❌ ERROR: Hai records `(userId=123, key='sound')`

2. **Null Safety:**  
   `userId = NULL` được dùng cho global config  
   Khi query, cần xử lý NULL properly:
   ```typescript
   userId: userId || IsNull()
   ```

3. **Performance:**  
   Index trên `userId` đảm bảo queries nhanh  
   Composite index `(userId, key)` tối ưu cho lookups

4. **Backward Compatibility:**  
   Configs cũ (không có userId) vẫn hoạt động bình thường  
   Migration sẽ set `userId = NULL` cho tất cả records cũ

---

## 📖 Example Implementation

### Backend: Check user's notification preference

```typescript
async canSendNotification(userId: number): Promise<boolean> {
  const enablePush = await this.configService.getConfigValue(
    'enable_push_notifications',
    userId,
    true  // default enabled
  );
  
  const quietHours = await this.configService.getConfigValue(
    'quiet_hours',
    userId,
    null
  );
  
  if (!enablePush) return false;
  
  if (quietHours?.enabled) {
    const now = new Date();
    const currentTime = now.getHours();
    const [startHour] = quietHours.start.split(':').map(Number);
    const [endHour] = quietHours.end.split(':').map(Number);
    
    if (currentTime >= startHour || currentTime < endHour) {
      return false; // In quiet hours
    }
  }
  
  return true;
}
```

### Frontend: User preferences page

```typescript
// Lấy preferences của user hiện tại
const { data: myConfigs } = await getMyNotificationConfigs({
  page: 1,
  size: 100
});

// Update preference
await updateNotificationConfig(configId, {
  userId: currentUser.id,
  key: 'enable_push_notifications',
  value: 'true',
  isActive: true
});
```

---

## 🎉 Benefits

✅ **Personalization** - Mỗi user tự quản lý preferences  
✅ **Flexibility** - Hỗ trợ cả global và user-specific configs  
✅ **Scalability** - Priority system cho phép override dễ dàng  
✅ **User Control** - Users có quyền kiểm soát notifications của họ  
✅ **Admin Control** - Admin vẫn có thể set global defaults  

---

## 📞 Support

Nếu có câu hỏi hoặc vấn đề, vui lòng liên hệ team backend. 🚀

