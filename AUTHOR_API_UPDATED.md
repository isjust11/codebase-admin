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
  "avatar": "URL hình đại diện",
  "coverImage": "URL hình bìa",
  "galleryImages": ["URL hình 1", "URL hình 2"],
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
  "avatar": "URL hình đại diện",
  "coverImage": "URL hình bìa",
  "galleryImages": ["URL hình 1", "URL hình 2"],
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

## Các trường hình ảnh mới

### 1. `avatar` (string, optional)
- **Mô tả**: Hình đại diện của tác giả
- **Định dạng**: URL hoặc đường dẫn file
- **Kích thước khuyến nghị**: 200x200px (hình vuông)
- **Mục đích**: Hiển thị trong danh sách, profile nhỏ

### 2. `coverImage` (string, optional)  
- **Mô tả**: Hình ảnh bìa/header của trang tác giả
- **Định dạng**: URL hoặc đường dẫn file
- **Kích thước khuyến nghị**: 1200x400px (hình chữ nhật ngang)
- **Mục đích**: Hiển thị ở đầu trang chi tiết tác giả

### 3. `galleryImages` (array of strings, optional)
- **Mô tả**: Bộ sưu tập các hình ảnh khác của tác giả
- **Định dạng**: Mảng các URL hoặc đường dẫn file
- **Kích thước khuyến nghị**: 800x600px (tỷ lệ 4:3)
- **Mục đích**: Hiển thị trong gallery, slideshow

### 4. `portrait` (string, optional)
- **Mô tả**: Chân dung chính của tác giả (đã có sẵn)
- **Định dạng**: URL hoặc đường dẫn file  
- **Kích thước khuyến nghị**: 400x500px (tỷ lệ 4:5)
- **Mục đích**: Hiển thị chân dung chính trong trang chi tiết

## Lưu ý khi sử dụng

1. **Validation**: Tất cả các trường hình ảnh đều là optional
2. **Định dạng**: Hỗ trợ các định dạng phổ biến: JPG, PNG, WebP
3. **Kích thước file**: Khuyến nghị dưới 5MB cho mỗi hình
4. **Storage**: Có thể lưu trữ local hoặc cloud storage (AWS S3, Cloudinary...)
5. **CDN**: Nên sử dụng CDN để tối ưu tốc độ tải hình ảnh
