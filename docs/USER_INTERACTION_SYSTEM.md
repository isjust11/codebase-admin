# Hệ thống quản lý tương tác người dùng (User Interaction System)

## Tổng quan

Hệ thống này cho phép quản lý các thao tác của người dùng với các đối tượng khác nhau trong ứng dụng như like, bookmark, share, rate, follow, v.v.

## Các thành phần chính

### 1. Entities

#### UserInteraction
- Quản lý các tương tác của người dùng
- Hỗ trợ nhiều loại tương tác: like, dislike, bookmark, share, view, comment, rate, follow
- Hỗ trợ nhiều đối tượng: article, herbal, folk_medicine, author, user, category

#### InteractionStats
- Thống kê tổng hợp các tương tác
- Tự động cập nhật khi có tương tác mới
- Cung cấp số liệu thống kê cho từng đối tượng

### 2. Enums

#### InteractionType
```typescript
enum InteractionType {
  LIKE = 'like',
  DISLIKE = 'dislike',
  BOOKMARK = 'bookmark',
  SHARE = 'share',
  VIEW = 'view',
  COMMENT = 'comment',
  RATE = 'rate',
  FOLLOW = 'follow',
  UNFOLLOW = 'unfollow'
}
```

#### InteractionTarget
```typescript
enum InteractionTarget {
  ARTICLE = 'article',
  HERBAL = 'herbal',
  FOLK_MEDICINE = 'folk_medicine',
  AUTHOR = 'author',
  USER = 'user',
  COMMENT = 'comment',
  CATEGORY = 'category'
}
```

## API Endpoints

### 1. Tạo tương tác
```http
POST /user-interactions
Content-Type: application/json
Authorization: Bearer <token>

{
  "interactionType": "like",
  "targetType": "article",
  "targetId": 123,
  "rating": 4.5, // optional, for rate interactions
  "comment": "Great article!", // optional, for comment interactions
  "sharePlatform": "facebook" // optional, for share interactions
}
```

### 2. Cập nhật tương tác
```http
PUT /user-interactions/{targetType}/{targetId}/{interactionType}
Content-Type: application/json
Authorization: Bearer <token>

{
  "rating": 5.0,
  "comment": "Updated comment"
}
```

### 3. Xóa tương tác
```http
DELETE /user-interactions/{targetType}/{targetId}/{interactionType}
Authorization: Bearer <token>
```

### 4. Lấy danh sách tương tác của user
```http
GET /user-interactions/my-interactions?interactionType=like&targetType=article&page=1&limit=10
Authorization: Bearer <token>
```

### 5. Lấy thống kê tương tác
```http
GET /user-interactions/stats/{targetType}/{targetId}
```

### 6. Lấy trạng thái tương tác của user
```http
GET /user-interactions/status/{targetType}/{targetId}
Authorization: Bearer <token>
```

## Convenience Endpoints

### Like/Unlike
```http
POST /user-interactions/like/{targetType}/{targetId}
DELETE /user-interactions/unlike/{targetType}/{targetId}
```

### Bookmark/Unbookmark
```http
POST /user-interactions/bookmark/{targetType}/{targetId}
DELETE /user-interactions/unbookmark/{targetType}/{targetId}
```

### Share
```http
POST /user-interactions/share/{targetType}/{targetId}
{
  "sharePlatform": "facebook"
}
```

### Rate
```http
POST /user-interactions/rate/{targetType}/{targetId}
{
  "rating": 4.5
}
```

### Follow/Unfollow
```http
POST /user-interactions/follow/{targetType}/{targetId}
DELETE /user-interactions/unfollow/{targetType}/{targetId}
```

## Ví dụ sử dụng

### 1. Like một bài viết
```javascript
// Like bài viết
const response = await fetch('/user-interactions/like/article/123', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

// Unlike bài viết
await fetch('/user-interactions/unlike/article/123', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

### 2. Đánh giá một bài thuốc
```javascript
const response = await fetch('/user-interactions/rate/herbal/456', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    rating: 4.5
  })
});
```

### 3. Lưu bài viết vào bookmark
```javascript
const response = await fetch('/user-interactions/bookmark/article/123', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

### 4. Lấy thống kê của một bài viết
```javascript
const stats = await fetch('/user-interactions/stats/article/123');
const data = await stats.json();
console.log(data); // { likeCount: 10, bookmarkCount: 5, shareCount: 3, ... }
```

### 5. Kiểm tra trạng thái tương tác của user
```javascript
const status = await fetch('/user-interactions/status/article/123', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
const data = await status.json();
console.log(data); // { like: true, bookmark: false, rate: true, ... }
```

## Tính năng đặc biệt

### 1. Tự động cập nhật thống kê
- Khi có tương tác mới, hệ thống tự động cập nhật `InteractionStats`
- Hỗ trợ tính toán rating trung bình cho các tương tác đánh giá

### 2. Validation
- Kiểm tra sự tồn tại của target trước khi tạo tương tác
- Ngăn chặn tạo tương tác trùng lặp
- Validation rating trong khoảng 1-5

### 3. Indexing
- Tối ưu hóa query với composite index
- Hỗ trợ tìm kiếm nhanh theo user, target, và interaction type

### 4. Metadata
- Hỗ trợ lưu trữ thông tin bổ sung trong trường `metadata`
- Linh hoạt cho các yêu cầu tương tác đặc biệt

## Database Schema

### UserInteraction Table
```sql
CREATE TABLE user_interaction (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  interactionType ENUM('like', 'dislike', 'bookmark', 'share', 'view', 'comment', 'rate', 'follow', 'unfollow') NOT NULL,
  targetType ENUM('article', 'herbal', 'folk_medicine', 'author', 'user', 'comment', 'category') NOT NULL,
  targetId INT NOT NULL,
  articleId INT NULL,
  herbalId INT NULL,
  folkMedicineId INT NULL,
  authorId INT NULL,
  categoryId INT NULL,
  rating DECIMAL(3,2) NULL,
  comment TEXT NULL,
  sharePlatform VARCHAR(255) NULL,
  metadata JSON NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_interaction (userId, targetType, targetId, interactionType),
  INDEX idx_user_target (userId, targetType, targetId)
);
```

### InteractionStats Table
```sql
CREATE TABLE interaction_stats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  targetType ENUM('article', 'herbal', 'folk_medicine', 'author', 'user', 'comment', 'category') NOT NULL,
  targetId INT NOT NULL,
  likeCount INT DEFAULT 0,
  dislikeCount INT DEFAULT 0,
  bookmarkCount INT DEFAULT 0,
  shareCount INT DEFAULT 0,
  viewCount INT DEFAULT 0,
  commentCount INT DEFAULT 0,
  rateCount INT DEFAULT 0,
  followCount INT DEFAULT 0,
  averageRating DECIMAL(3,2) DEFAULT 0,
  totalRating DECIMAL(10,2) DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_target (targetType, targetId)
);
```

## Lưu ý quan trọng

1. **Authentication**: Tất cả endpoints đều yêu cầu authentication
2. **Rate Limiting**: Nên implement rate limiting để tránh spam
3. **Caching**: Có thể cache thống kê để tăng performance
4. **Cleanup**: Nên có job cleanup các tương tác cũ không cần thiết
5. **Analytics**: Có thể tích hợp với hệ thống analytics để tracking user behavior
