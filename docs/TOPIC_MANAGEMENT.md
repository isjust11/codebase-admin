# Topic Management System

## Overview
Hệ thống quản lý FCM Topics cho phép admin tạo, chỉnh sửa, xóa và quản lý các topics để gửi push notification theo nhóm.

## Database Setup

### 1. Chạy Migration
```bash
npm run migration:run
```

Migration sẽ tạo bảng `topics` và insert 5 topics mặc định:
- `topic-article` - Bài viết mới
- `topic-folk-medicine` - Bài thuốc dân gian  
- `topic-news` - Tin tức
- `topic-updates` - Cập nhật hệ thống
- `topic-promotions` - Khuyến mãi

### 2. Cấu trúc bảng Topics

```sql
CREATE TABLE topics (
  id UUID PRIMARY KEY,
  topicId VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  icon VARCHAR,
  category VARCHAR DEFAULT 'other',
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Backend Endpoints

### Topics Management (CRUD)

#### 1. Get All Topics
```
GET /api/topics
Authorization: Bearer {token}
Permission: READ notification
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "topicId": "topic-article",
      "name": "Bài viết mới",
      "description": "Nhận thông báo khi có bài viết mới",
      "icon": "📝",
      "category": "content",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 2. Get Active Topics Only
```
GET /api/topics/active
Authorization: Bearer {token}
```

#### 3. Get Single Topic
```
GET /api/topics/:id
Authorization: Bearer {token}
Permission: READ notification
```

#### 4. Create Topic
```
POST /api/topics
Authorization: Bearer {token}
Permission: CREATE notification

Body:
{
  "topicId": "topic-custom",
  "name": "Custom Topic",
  "description": "Description here",
  "icon": "🎯",
  "category": "content",
  "isActive": true
}
```

#### 5. Update Topic
```
PATCH /api/topics/:id
Authorization: Bearer {token}
Permission: UPDATE notification

Body:
{
  "name": "Updated Name",
  "description": "Updated Description",
  "isActive": false
}
```

#### 6. Toggle Active Status
```
PATCH /api/topics/:id/toggle-active
Authorization: Bearer {token}
Permission: UPDATE notification
```

#### 7. Delete Topic
```
DELETE /api/topics/:id
Authorization: Bearer {token}
Permission: DELETE notification
```

### FCM Token Endpoints (Updated)

#### Get Available Topics
```
GET /api/fcm-tokens/available-topics
Authorization: Bearer {token}
```
Now returns topics from database instead of hardcoded list.

#### Get All Topics Stats
```
GET /api/fcm-tokens/admin/stats
Authorization: Bearer {token}
Permission: READ notification
```
Dynamically gets stats for all active topics from database.

## Frontend Pages

### Topics Management Page
Path: `/manager/topics`

Features:
- ✅ View all topics in table
- ✅ Create new topic with modal
- ✅ Edit existing topic
- ✅ Delete topic with confirmation
- ✅ Toggle active/inactive status
- ✅ Search and sort
- ✅ Icon display
- ✅ Category badges

### Form Fields:
- **Topic ID** (required, unique) - e.g., `topic-custom`
- **Name** (required) - Display name
- **Description** - Detailed description
- **Icon** - Emoji or icon identifier
- **Category** (required) - content, news, system, marketing, other
- **Is Active** - Checkbox

## Integration with FCM

### How Topics Work:

1. **Admin creates topic** in `/manager/topics`
2. **Topic becomes available** in `/fcm-tokens/available-topics`
3. **Users can subscribe** via mobile app or admin force-subscribe
4. **Send notification to topic** broadcasts to all subscribers

### Subscribe User to Topic:
```typescript
await forceSubscribe(userId, 'topic-article');
```

### Send Notification to Topic:
```typescript
await sendFcmToTopic('topic-article', {
  title: 'New Article',
  body: 'Check out our latest post!',
});
```

### Get Topic Statistics:
```typescript
const stats = await getAllTopicsStats();
// Returns subscriber count and active tokens for each topic
```

## Module Setup

Add `TopicModule` to `app.module.ts`:

```typescript
import { TopicModule } from './modules/topic.module';

@Module({
  imports: [
    // ... other modules
    TopicModule,
  ],
})
export class AppModule {}
```

Update `NotificationModule` to import `TopicModule`:

```typescript
import { TopicModule } from '../topic.module';

@Module({
  imports: [
    // ... other imports
    TopicModule,
  ],
})
export class NotificationModule {}
```

## i18n Keys

Add to `messages/vi.json` and `en.json`:

```json
{
  "TopicManagementPage": {
    "title": "Quản lý Topics",
    "addTopic": "Thêm Topic",
    "editTopic": "Chỉnh sửa Topic",
    "createTopic": "Tạo Topic",
    "viewEdit": "Xem/Sửa",
    "topicId": "Topic ID",
    "name": "Tên",
    "description": "Mô tả",
    "icon": "Icon",
    "category": "Danh mục",
    "status": "Trạng thái",
    "isActive": "Kích hoạt",
    "actions": "Thao tác",
    "createdAt": "Ngày tạo",
    "namePlaceholder": "Nhập tên topic",
    "descriptionPlaceholder": "Nhập mô tả chi tiết",
    "selectCategory": "-- Chọn danh mục --",
    "categories": {
      "content": "Nội dung",
      "news": "Tin tức",
      "system": "Hệ thống",
      "marketing": "Marketing",
      "other": "Khác"
    },
    "messages": {
      "loadError": "Không thể tải danh sách topics",
      "validationError": "Vui lòng điền đầy đủ thông tin bắt buộc",
      "createSuccess": "Tạo topic thành công",
      "createError": "Lỗi khi tạo topic",
      "updateSuccess": "Cập nhật topic thành công",
      "updateError": "Lỗi khi cập nhật topic",
      "deleteSuccess": "Xóa topic thành công",
      "deleteError": "Lỗi khi xóa topic",
      "toggleSuccess": "Thay đổi trạng thái thành công",
      "toggleError": "Lỗi khi thay đổi trạng thái",
      "deleteTitle": "Xác nhận xóa",
      "deleteDescription": "Bạn có chắc muốn xóa topic này? Hành động này không thể hoàn tác."
    }
  }
}
```

## Best Practices

### Topic ID Naming Convention:
- Use lowercase
- Separate words with hyphens
- Prefix with `topic-`
- Example: `topic-custom-feature`

### Categories:
- **content**: Articles, posts, media
- **news**: News updates, announcements
- **system**: System notifications, maintenance
- **marketing**: Promotions, offers
- **other**: General purpose

### Icons:
- Use emoji for consistency
- Single character preferred
- Examples: 📝, 📰, 🔔, 🎁, 🌿

## Troubleshooting

### Topic not appearing in available-topics
- Check `isActive` is `true`
- Verify backend service is running
- Check permissions

### Cannot delete topic
- Check if users are still subscribed
- Consider deactivating instead of deleting

### Migration fails
- Ensure PostgreSQL UUID extension: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
- Check database connection

## Future Enhancements

- [ ] Bulk import/export topics
- [ ] Topic analytics dashboard
- [ ] Custom topic permissions
- [ ] Multi-language topic names
- [ ] Topic groups/hierarchies

