# Data Source API Documentation

## Tổng quan
API Data Source cho phép quản lý các nguồn dữ liệu được sử dụng trong hệ thống, bao gồm website, ebook, sách, tạp chí, bài nghiên cứu, v.v.

## Endpoints

### 1. Tạo nguồn dữ liệu mới
```
POST /data-sources
```

**Body:**
```json
{
  "name": "Tên nguồn dữ liệu",
  "title": "Tiêu đề (tùy chọn)",
  "description": "Mô tả (tùy chọn)",
  "type": "website|ebook|book|journal|research_paper|interview|document|other",
  "url": "https://example.com (tùy chọn)",
  "author": "Tác giả (tùy chọn)",
  "publisher": "Nhà xuất bản (tùy chọn)",
  "publishDate": "2024-01-01 (tùy chọn)",
  "isbn": "ISBN (tùy chọn)",
  "doi": "DOI (tùy chọn)",
  "citation": "Trích dẫn (tùy chọn)",
  "notes": "Ghi chú (tùy chọn)",
  "isActive": true
}
```

**Response:**
```json
{
  "statusCode": 201,
  "message": "Tạo nguồn dữ liệu thành công",
  "data": {
    "id": 1,
    "name": "Tên nguồn dữ liệu",
    "title": "Tiêu đề",
    "description": "Mô tả",
    "type": "website",
    "url": "https://example.com",
    "author": "Tác giả",
    "publisher": "Nhà xuất bản",
    "publishDate": "2024-01-01T00:00:00.000Z",
    "isbn": "123456789",
    "doi": "10.1000/example",
    "citation": "Trích dẫn",
    "notes": "Ghi chú",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Lấy danh sách nguồn dữ liệu
```
GET /data-sources
```

**Query Parameters:**
- `search`: Tìm kiếm theo tên, tiêu đề, mô tả, tác giả
- `type`: Lọc theo loại nguồn dữ liệu
- `author`: Lọc theo tác giả
- `publisher`: Lọc theo nhà xuất bản
- `isActive`: Lọc theo trạng thái (true/false)
- `sortBy`: Sắp xếp theo trường (mặc định: createdAt)
- `sortOrder`: Thứ tự sắp xếp (ASC/DESC, mặc định: DESC)
- `page`: Trang (mặc định: 1)
- `limit`: Số lượng mỗi trang (mặc định: 10)

**Response:**
```json
{
  "statusCode": 200,
  "message": "Lấy danh sách nguồn dữ liệu thành công",
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

### 3. Lấy thông tin nguồn dữ liệu theo ID
```
GET /data-sources/:id
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Lấy thông tin nguồn dữ liệu thành công",
  "data": {
    "id": 1,
    "name": "Tên nguồn dữ liệu",
    "title": "Tiêu đề",
    "description": "Mô tả",
    "type": "website",
    "url": "https://example.com",
    "author": "Tác giả",
    "publisher": "Nhà xuất bản",
    "publishDate": "2024-01-01T00:00:00.000Z",
    "isbn": "123456789",
    "doi": "10.1000/example",
    "citation": "Trích dẫn",
    "notes": "Ghi chú",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "folkMedicines": [...]
  }
}
```

### 4. Cập nhật nguồn dữ liệu
```
PATCH /data-sources/:id
```

**Body:** (tất cả các trường đều tùy chọn)
```json
{
  "name": "Tên mới",
  "title": "Tiêu đề mới",
  "description": "Mô tả mới",
  "type": "book",
  "url": "https://new-example.com",
  "author": "Tác giả mới",
  "publisher": "Nhà xuất bản mới",
  "publishDate": "2024-02-01",
  "isbn": "987654321",
  "doi": "10.1000/new-example",
  "citation": "Trích dẫn mới",
  "notes": "Ghi chú mới",
  "isActive": false
}
```

### 5. Xóa nguồn dữ liệu
```
DELETE /data-sources/:id
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Xóa nguồn dữ liệu thành công"
}
```

### 6. Lấy danh sách loại nguồn dữ liệu
```
GET /data-sources/types
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Lấy danh sách loại nguồn dữ liệu thành công",
  "data": [
    { "value": "website", "label": "Website" },
    { "value": "ebook", "label": "E-book" },
    { "value": "book", "label": "Sách" },
    { "value": "journal", "label": "Tạp chí" },
    { "value": "research_paper", "label": "Bài nghiên cứu" },
    { "value": "interview", "label": "Phỏng vấn" },
    { "value": "document", "label": "Tài liệu" },
    { "value": "other", "label": "Khác" }
  ]
}
```

### 7. Lấy thống kê nguồn dữ liệu
```
GET /data-sources/statistics
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Lấy thống kê nguồn dữ liệu thành công",
  "data": {
    "total": 100,
    "byType": [
      { "type": "website", "count": 50 },
      { "type": "book", "count": 30 },
      { "type": "journal", "count": 20 }
    ],
    "activeCount": 95,
    "inactiveCount": 5
  }
}
```

## Phân quyền

- **ADMIN**: Có thể thực hiện tất cả các thao tác
- **EDITOR**: Có thể tạo, xem, cập nhật nguồn dữ liệu
- **VIEWER**: Chỉ có thể xem nguồn dữ liệu

## Lưu ý

1. Không thể xóa nguồn dữ liệu đang được sử dụng bởi các bài thuốc
2. Tất cả các endpoint đều yêu cầu xác thực JWT
3. Các trường validation được áp dụng theo DTO
4. Hỗ trợ tìm kiếm và lọc linh hoạt
5. Phân trang mặc định 10 items/trang
