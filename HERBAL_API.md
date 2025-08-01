# Herbal API Documentation

## Tổng quan
API này cung cấp các endpoint để quản lý thảo dược (herbal) và hình ảnh thảo dược trong hệ thống.

## Cấu trúc dữ liệu

### HerbalImageType Enum
- `main`: Hình ảnh chính
- `detail`: Hình ảnh chi tiết  
- `part`: Hình ảnh bộ phận
- `growth`: Hình ảnh quá trình sinh trưởng
- `processing`: Hình ảnh quá trình bào chế
- `usage`: Hình ảnh cách sử dụng
- `other`: Hình ảnh khác

## Base URL
```
http://localhost:3000/herbals
```

## Endpoints

### 1. Tạo thảo dược mới
**POST** `/herbals`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Tên thảo dược",
  "summary": "Mô tả ngắn gọn",
  "content": "Nội dung chi tiết",
  "scientificName": "Tên khoa học",
  "commonNames": "Tên thường gọi",
  "family": "Họ thực vật",
  "partsUsed": "Bộ phận sử dụng",
  "activeCompounds": "Hoạt chất chính",
  "medicinalProperties": "Tính chất dược liệu",
  "preparationMethods": "Phương pháp bào chế",
  "dosage": "Liều lượng sử dụng",
  "contraindications": "Chống chỉ định",
  "sideEffects": "Tác dụng phụ",
  "thumbnail": "URL hình ảnh",
  "authorId": "ID tác giả",
  "categoryId": "ID danh mục",
  "isActive": true,
  "images": [
    {
      "id": 1,
      "url": "URL hình ảnh",
      "alt": "Mô tả hình ảnh",
      "description": "Mô tả chi tiết",
      "type": "main",
      "sortOrder": 0,
      "isActive": true,
      "herbalId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Response:**
```json
{
  "id": 1,
  "title": "Tên thảo dược",
  "slug": "ten-thao-duoc",
  "summary": "Mô tả ngắn gọn",
  "content": "Nội dung chi tiết",
  "scientificName": "Tên khoa học",
  "commonNames": "Tên thường gọi",
  "family": "Họ thực vật",
  "partsUsed": "Bộ phận sử dụng",
  "activeCompounds": "Hoạt chất chính",
  "medicinalProperties": "Tính chất dược liệu",
  "preparationMethods": "Phương pháp bào chế",
  "dosage": "Liều lượng sử dụng",
  "contraindications": "Chống chỉ định",
  "sideEffects": "Tác dụng phụ",
  "thumbnail": "URL hình ảnh",
  "viewCount": 0,
  "likeCount": 0,
  "authorId": "ID tác giả",
  "categoryId": "ID danh mục",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 2. Lấy danh sách thảo dược
**GET** `/herbals`

**Query Parameters:**
- `page`: Số trang (mặc định: 1)
- `size`: Số lượng item mỗi trang (mặc định: 10)
- `search`: Từ khóa tìm kiếm

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Tên thảo dược",
      "slug": "ten-thao-duoc",
      "summary": "Mô tả ngắn gọn",
      "content": "Nội dung chi tiết",
      "scientificName": "Tên khoa học",
      "commonNames": "Tên thường gọi",
      "family": "Họ thực vật",
      "partsUsed": "Bộ phận sử dụng",
      "activeCompounds": "Hoạt chất chính",
      "medicinalProperties": "Tính chất dược liệu",
      "preparationMethods": "Phương pháp bào chế",
      "dosage": "Liều lượng sử dụng",
      "contraindications": "Chống chỉ định",
      "sideEffects": "Tác dụng phụ",
      "thumbnail": "URL hình ảnh",
      "viewCount": 0,
      "likeCount": 0,
      "authorId": "ID tác giả",
      "categoryId": "ID danh mục",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "size": 10,
  "totalPages": 1
}
```

### 3. Lấy thảo dược theo ID
**GET** `/herbals/:id`

**Response:**
```json
{
  "id": 1,
  "title": "Tên thảo dược",
  "slug": "ten-thao-duoc",
  "summary": "Mô tả ngắn gọn",
  "content": "Nội dung chi tiết",
  "scientificName": "Tên khoa học",
  "commonNames": "Tên thường gọi",
  "family": "Họ thực vật",
  "partsUsed": "Bộ phận sử dụng",
  "activeCompounds": "Hoạt chất chính",
  "medicinalProperties": "Tính chất dược liệu",
  "preparationMethods": "Phương pháp bào chế",
  "dosage": "Liều lượng sử dụng",
  "contraindications": "Chống chỉ định",
  "sideEffects": "Tác dụng phụ",
  "thumbnail": "URL hình ảnh",
  "viewCount": 0,
  "likeCount": 0,
  "authorId": "ID tác giả",
  "categoryId": "ID danh mục",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 4. Cập nhật thảo dược
**PATCH** `/herbals/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:** (Tương tự như tạo mới, nhưng tất cả fields đều optional)

**Response:** Tương tự như response của GET /:id

### 5. Xóa thảo dược
**DELETE** `/herbals/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** 204 No Content

### 6. Tìm thảo dược theo danh mục
**GET** `/herbals/category/:categoryId`

**Response:**
```json
[
  {
    "id": 1,
    "title": "Tên thảo dược",
    "slug": "ten-thao-duoc",
    "summary": "Mô tả ngắn gọn",
    "content": "Nội dung chi tiết",
    "scientificName": "Tên khoa học",
    "commonNames": "Tên thường gọi",
    "family": "Họ thực vật",
    "partsUsed": "Bộ phận sử dụng",
    "activeCompounds": "Hoạt chất chính",
    "medicinalProperties": "Tính chất dược liệu",
    "preparationMethods": "Phương pháp bào chế",
    "dosage": "Liều lượng sử dụng",
    "contraindications": "Chống chỉ định",
    "sideEffects": "Tác dụng phụ",
    "thumbnail": "URL hình ảnh",
    "viewCount": 0,
    "likeCount": 0,
    "authorId": "ID tác giả",
    "categoryId": "ID danh mục",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### 7. Tìm thảo dược theo tên khoa học
**GET** `/herbals/scientific-name/:scientificName`

**Response:** Tương tự như endpoint category

### 8. Tìm thảo dược theo họ thực vật
**GET** `/herbals/family/:family`

**Response:** Tương tự như endpoint category

### 9. Tăng lượt xem
**POST** `/herbals/:id/view`

**Response:** 200 OK

### 10. Tăng lượt thích
**POST** `/herbals/:id/like`

**Response:** 200 OK

## Herbal Image Endpoints

### 1. Tạo hình ảnh thảo dược
**POST** `/herbal-images`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "url": "URL hình ảnh",
  "alt": "Mô tả hình ảnh",
  "description": "Mô tả chi tiết",
  "type": "main",
  "sortOrder": 0,
  "isActive": true,
  "herbalId": 1
}
```

### 2. Lấy tất cả hình ảnh
**GET** `/herbal-images`

### 3. Lấy hình ảnh theo thảo dược
**GET** `/herbal-images/herbal/:herbalId`

### 4. Lấy hình ảnh theo loại
**GET** `/herbal-images/herbal/:herbalId/type/:type`

### 5. Lấy hình ảnh chính
**GET** `/herbal-images/herbal/:herbalId/main`

### 6. Lấy hình ảnh theo ID
**GET** `/herbal-images/:id`

### 7. Cập nhật hình ảnh
**PATCH** `/herbal-images/:id`

### 8. Xóa hình ảnh
**DELETE** `/herbal-images/:id`

### 9. Xóa tất cả hình ảnh của thảo dược
**DELETE** `/herbal-images/herbal/:herbalId`

### 10. Cập nhật thứ tự hình ảnh
**POST** `/herbal-images/sort-order`

**Body:**
```json
[
  {
    "id": 1,
    "sortOrder": 0
  },
  {
    "id": 2,
    "sortOrder": 1
  }
]
```

## Lưu ý
- Tất cả các endpoint tạo, cập nhật, xóa đều yêu cầu authentication
- Các endpoint tìm kiếm và xem chi tiết không yêu cầu authentication
- Tìm kiếm hỗ trợ tìm theo title, slug, summary, scientificName, commonNames
- Slug được tự động tạo từ title khi tạo hoặc cập nhật
- Mỗi thảo dược có thể có nhiều hình ảnh với các loại khác nhau
- Hình ảnh được sắp xếp theo sortOrder và thời gian tạo
- Khi xóa thảo dược, tất cả hình ảnh liên quan sẽ bị xóa (CASCADE) 