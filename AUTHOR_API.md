# Author API Documentation

## Tổng quan
API này cung cấp các endpoint để quản lý thông tin tác giả các bài thuốc, bao gồm các danh y nổi tiếng như Hải Thượng Lãn Ông.

## Base URL
```
http://localhost:3000/authors
```

## Endpoints

### 1. Tạo tác giả mới
**POST** `/authors`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Hải Thượng Lãn Ông",
  "alias": "Lê Hữu Trác",
  "biography": "Hải Thượng Lãn Ông (1720-1791) là một danh y nổi tiếng của Việt Nam...",
  "career": "Ông là một thầy thuốc, nhà văn, nhà thơ...",
  "achievements": "Tác giả của bộ sách 'Hải Thượng Y Tông Tâm Lĩnh'...",
  "contributions": "Đóng góp lớn cho nền y học cổ truyền Việt Nam...",
  "works": "Hải Thượng Y Tông Tâm Lĩnh, Thượng Kinh Ký Sự...",
  "philosophy": "Triết lý y học của ông dựa trên...",
  "legacy": "Di sản y học của ông vẫn được nghiên cứu...",
  "birthDate": "1720-01-01",
  "deathDate": "1791-01-01",
  "birthPlace": "Liêu Xá, Hưng Yên",
  "deathPlace": "Hà Tĩnh",
  "era": "Lê Trung Hưng",
  "dynasty": "Nhà Lê",
  "specialty": "Y học cổ truyền",
  "teacher": "Các thầy thuốc đương thời",
  "students": "Nhiều học trò theo học...",
  "portrait": "URL hình ảnh",
  "quotes": "Những câu nói nổi tiếng...",
  "anecdotes": "Giai thoại về cuộc đời...",
  "honors": "Danh hiệu và vinh dự...",
  "memorials": "Các đền thờ, tượng đài...",
  "references": "Tài liệu tham khảo...",
  "isActive": true
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Hải Thượng Lãn Ông",
  "slug": "hai-thuong-lan-ong",
  "alias": "Lê Hữu Trác",
  "biography": "Hải Thượng Lãn Ông (1720-1791) là một danh y nổi tiếng...",
  "career": "Ông là một thầy thuốc, nhà văn, nhà thơ...",
  "achievements": "Tác giả của bộ sách 'Hải Thượng Y Tông Tâm Lĩnh'...",
  "contributions": "Đóng góp lớn cho nền y học cổ truyền Việt Nam...",
  "works": "Hải Thượng Y Tông Tâm Lĩnh, Thượng Kinh Ký Sự...",
  "philosophy": "Triết lý y học của ông dựa trên...",
  "legacy": "Di sản y học của ông vẫn được nghiên cứu...",
  "birthDate": "1720-01-01",
  "deathDate": "1791-01-01",
  "birthPlace": "Liêu Xá, Hưng Yên",
  "deathPlace": "Hà Tĩnh",
  "era": "Lê Trung Hưng",
  "dynasty": "Nhà Lê",
  "specialty": "Y học cổ truyền",
  "teacher": "Các thầy thuốc đương thời",
  "students": "Nhiều học trò theo học...",
  "portrait": "URL hình ảnh",
  "quotes": "Những câu nói nổi tiếng...",
  "anecdotes": "Giai thoại về cuộc đời...",
  "honors": "Danh hiệu và vinh dự...",
  "memorials": "Các đền thờ, tượng đài...",
  "references": "Tài liệu tham khảo...",
  "viewCount": 0,
  "likeCount": 0,
  "isActive": true,
  "herbals": [],
  "folkMedicines": [],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 2. Lấy danh sách tác giả
**GET** `/authors`

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
      "name": "Hải Thượng Lãn Ông",
      "slug": "hai-thuong-lan-ong",
      "alias": "Lê Hữu Trác",
      "biography": "Hải Thượng Lãn Ông (1720-1791)...",
      "career": "Ông là một thầy thuốc...",
      "achievements": "Tác giả của bộ sách...",
      "contributions": "Đóng góp lớn cho nền y học...",
      "works": "Hải Thượng Y Tông Tâm Lĩnh...",
      "philosophy": "Triết lý y học của ông...",
      "legacy": "Di sản y học của ông...",
      "birthDate": "1720-01-01",
      "deathDate": "1791-01-01",
      "birthPlace": "Liêu Xá, Hưng Yên",
      "deathPlace": "Hà Tĩnh",
      "era": "Lê Trung Hưng",
      "dynasty": "Nhà Lê",
      "specialty": "Y học cổ truyền",
      "teacher": "Các thầy thuốc đương thời",
      "students": "Nhiều học trò theo học...",
      "portrait": "URL hình ảnh",
      "quotes": "Những câu nói nổi tiếng...",
      "anecdotes": "Giai thoại về cuộc đời...",
      "honors": "Danh hiệu và vinh dự...",
      "memorials": "Các đền thờ, tượng đài...",
      "references": "Tài liệu tham khảo...",
      "viewCount": 0,
      "likeCount": 0,
      "isActive": true,
      "herbals": [],
      "folkMedicines": [],
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

### 3. Lấy tác giả theo ID
**GET** `/authors/:id`

### 4. Lấy tác giả theo slug
**GET** `/authors/slug/:slug`

### 5. Lấy danh sách tác giả nổi tiếng
**GET** `/authors/famous`

### 6. Tìm kiếm tác giả
**GET** `/authors/search/:query`

### 7. Lấy tác giả theo thời đại
**GET** `/authors/era/:era`

### 8. Lấy tác giả theo triều đại
**GET** `/authors/dynasty/:dynasty`

### 9. Lấy tác giả theo chuyên môn
**GET** `/authors/specialty/:specialty`

### 10. Cập nhật tác giả
**PATCH** `/authors/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:** (Tương tự như tạo mới, nhưng tất cả fields đều optional)

### 11. Xóa tác giả
**DELETE** `/authors/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** 204 No Content

### 12. Tăng lượt xem
**POST** `/authors/:id/view`

**Response:** 200 OK

### 13. Tăng lượt thích
**POST** `/authors/:id/like`

**Response:** 200 OK

## Ví dụ dữ liệu mẫu

### Hải Thượng Lãn Ông
```json
{
  "name": "Hải Thượng Lãn Ông",
  "alias": "Lê Hữu Trác",
  "biography": "Hải Thượng Lãn Ông (1720-1791) là một danh y nổi tiếng của Việt Nam thời Lê Trung Hưng. Ông được coi là một trong những đại danh y của Việt Nam.",
  "career": "Ông là một thầy thuốc, nhà văn, nhà thơ và nhà tư tưởng lớn của Việt Nam thế kỷ 18.",
  "achievements": "Tác giả của bộ sách 'Hải Thượng Y Tông Tâm Lĩnh' - một bộ sách y học đồ sộ gồm 28 tập.",
  "contributions": "Đóng góp lớn cho nền y học cổ truyền Việt Nam, kết hợp y học Trung Quốc với kinh nghiệm dân gian Việt Nam.",
  "works": "Hải Thượng Y Tông Tâm Lĩnh, Thượng Kinh Ký Sự, Vân Đài Loại Ngữ...",
  "philosophy": "Triết lý y học của ông dựa trên nguyên tắc 'Y học là nhân thuật' - coi việc chữa bệnh là một nghệ thuật nhân đạo.",
  "legacy": "Di sản y học của ông vẫn được nghiên cứu và áp dụng trong y học cổ truyền Việt Nam hiện đại.",
  "birthDate": "1720-01-01",
  "deathDate": "1791-01-01",
  "birthPlace": "Liêu Xá, Hưng Yên",
  "deathPlace": "Hà Tĩnh",
  "era": "Lê Trung Hưng",
  "dynasty": "Nhà Lê",
  "specialty": "Y học cổ truyền",
  "teacher": "Các thầy thuốc đương thời",
  "students": "Nhiều học trò theo học và kế thừa sự nghiệp của ông",
  "quotes": "Y học là nhân thuật, phải lấy nhân nghĩa làm gốc",
  "anecdotes": "Nhiều giai thoại về việc chữa bệnh cứu người của ông",
  "honors": "Được tôn vinh là Đại danh y Việt Nam",
  "memorials": "Đền thờ tại Hưng Yên, tượng đài tại nhiều nơi",
  "references": "Hải Thượng Y Tông Tâm Lĩnh, các tài liệu lịch sử y học Việt Nam"
}
```

## Lưu ý
- Tất cả các endpoint tạo, cập nhật, xóa đều yêu cầu authentication
- Các endpoint tìm kiếm và xem chi tiết không yêu cầu authentication
- Tìm kiếm hỗ trợ tìm theo name, alias, biography, career, achievements, contributions, works, philosophy, legacy, era, dynasty, specialty
- Slug được tự động tạo từ name khi tạo hoặc cập nhật
- Mỗi tác giả có thể có nhiều bài thuốc (herbals và folkMedicines)
- Hệ thống hỗ trợ lưu trữ thông tin chi tiết về cuộc đời, sự nghiệp và di sản của các danh y 