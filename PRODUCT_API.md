# Product Management API Documentation

## Overview
API này cung cấp các endpoint để quản lý sản phẩm, đánh giá sản phẩm và khiếu nại sản phẩm.

## Authentication
Tất cả các API endpoints đều yêu cầu JWT authentication và permission-based authorization.

## Product Endpoints

### 1. Get Products (Paginated)
```
GET /products
```
**Query Parameters:**
- `page` (number): Trang hiện tại (default: 1)
- `size` (number): Số lượng item mỗi trang (default: 10)
- `search` (string): Từ khóa tìm kiếm
- `categoryId` (string): ID danh mục
- `isActive` (boolean): Trạng thái hoạt động
- `isFeatured` (boolean): Sản phẩm nổi bật
- `minPrice` (number): Giá tối thiểu
- `maxPrice` (number): Giá tối đa
- `brand` (string): Thương hiệu
- `sortBy` (string): Sắp xếp theo (name, price, createdAt, viewCount, soldCount, rating)
- `sortOrder` (string): Thứ tự sắp xếp (ASC, DESC)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Product Name",
      "slug": "product-name",
      "description": "Product description",
      "price": 100000,
      "stock": 50,
      "isActive": true,
      "isFeatured": false,
      "viewCount": 100,
      "soldCount": 10,
      "rating": 4.5,
      "reviewCount": 5,
      "category": { ... },
      "createdBy": { ... },
      "updatedBy": { ... },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "size": 10,
  "totalPages": 10
}
```

### 2. Get All Products
```
GET /products/all
```

### 3. Get Featured Products
```
GET /products/featured?limit=10
```

### 4. Search Products
```
GET /products/search?q=keyword&limit=20
```

### 5. Get Products by Category
```
GET /products/category/:categoryId?limit=20
```

### 6. Get Product by ID
```
GET /products/:id
```

### 7. Get Product by Slug
```
GET /products/slug/:slug
```

### 8. Create Product
```
POST /products
```
**Body:**
```json
{
  "name": "Product Name",
  "slug": "product-name",
  "description": "Product description",
  "shortDescription": "Short description",
  "price": 100000,
  "originalPrice": 120000,
  "stock": 50,
  "sku": "SKU123",
  "barcode": "123456789",
  "brand": "Brand Name",
  "model": "Model XYZ",
  "specifications": "Product specifications",
  "features": "Product features",
  "warranty": "1 year warranty",
  "mainImage": "https://example.com/image.jpg",
  "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
  "isActive": true,
  "isFeatured": false,
  "weight": 1.5,
  "length": 10,
  "width": 5,
  "height": 3,
  "categoryId": "category-uuid"
}
```

### 9. Update Product
```
PUT /products/:id
```

### 10. Delete Product
```
DELETE /products/:id
```

### 11. Toggle Product Active Status
```
PUT /products/:id/toggle-active
```

### 12. Toggle Product Featured Status
```
PUT /products/:id/toggle-featured
```

### 13. Increment View Count
```
PUT /products/:id/increment-view
```

### 14. Update Stock
```
PUT /products/:id/update-stock
```
**Body:**
```json
{
  "quantity": -5
}
```

## Product Review Endpoints

### 1. Get Reviews (Paginated)
```
GET /product-reviews
```
**Query Parameters:**
- `page` (number): Trang hiện tại
- `size` (number): Số lượng item mỗi trang
- `productId` (string): ID sản phẩm
- `userId` (string): ID người dùng
- `rating` (number): Đánh giá (1-5)
- `isVerified` (boolean): Đã xác minh
- `isHelpful` (boolean): Hữu ích
- `sortBy` (string): Sắp xếp theo (rating, createdAt, helpfulCount)
- `sortOrder` (string): Thứ tự sắp xếp (ASC, DESC)

### 2. Get All Reviews
```
GET /product-reviews/all
```

### 3. Get Reviews by Product
```
GET /product-reviews/product/:productId?limit=10
```

### 4. Get Reviews by User
```
GET /product-reviews/user/:userId?limit=10
```

### 5. Get Review by ID
```
GET /product-reviews/:id
```

### 6. Create Review
```
POST /product-reviews
```
**Body:**
```json
{
  "rating": 5,
  "title": "Great product!",
  "comment": "This product is amazing!",
  "images": ["https://example.com/review1.jpg"],
  "isAnonymous": false,
  "productId": "product-uuid"
}
```

### 7. Update Review
```
PUT /product-reviews/:id
```

### 8. Delete Review
```
DELETE /product-reviews/:id
```

### 9. Reply to Review (Admin)
```
POST /product-reviews/:id/reply
```
**Body:**
```json
{
  "reply": "Thank you for your feedback!"
}
```

### 10. Toggle Review Verified Status
```
PUT /product-reviews/:id/toggle-verified
```

### 11. Toggle Review Helpful Status
```
PUT /product-reviews/:id/toggle-helpful
```

## Product Complaint Endpoints

### 1. Get Complaints (Paginated)
```
GET /product-complaints
```
**Query Parameters:**
- `page` (number): Trang hiện tại
- `size` (number): Số lượng item mỗi trang
- `productId` (string): ID sản phẩm
- `userId` (string): ID người dùng
- `assignedToId` (string): ID người được phân công
- `type` (string): Loại khiếu nại
- `status` (string): Trạng thái
- `priority` (string): Độ ưu tiên
- `isUrgent` (boolean): Khẩn cấp
- `sortBy` (string): Sắp xếp theo (createdAt, priority, status)
- `sortOrder` (string): Thứ tự sắp xếp (ASC, DESC)

### 2. Get All Complaints
```
GET /product-complaints/all
```

### 3. Get Urgent Complaints
```
GET /product-complaints/urgent
```

### 4. Get Complaint Statistics
```
GET /product-complaints/stats
```

### 5. Get Complaints by Status
```
GET /product-complaints/status/:status
```

### 6. Get Complaints by Type
```
GET /product-complaints/type/:type
```

### 7. Get Complaints by Assigned To
```
GET /product-complaints/assigned/:assignedToId
```

### 8. Get Complaints by Product
```
GET /product-complaints/product/:productId
```

### 9. Get Complaints by User
```
GET /product-complaints/user/:userId
```

### 10. Get Complaint by ID
```
GET /product-complaints/:id
```

### 11. Create Complaint
```
POST /product-complaints
```
**Body:**
```json
{
  "title": "Product Quality Issue",
  "description": "The product arrived damaged",
  "type": "QUALITY_ISSUE",
  "images": ["https://example.com/damage1.jpg"],
  "attachments": ["https://example.com/receipt.pdf"],
  "isUrgent": false,
  "isAnonymous": false,
  "contactPhone": "0123456789",
  "contactEmail": "user@example.com",
  "productId": "product-uuid"
}
```

### 12. Update Complaint
```
PUT /product-complaints/:id
```

### 13. Delete Complaint
```
DELETE /product-complaints/:id
```

### 14. Assign Complaint (Admin)
```
POST /product-complaints/:id/assign
```
**Body:**
```json
{
  "assignedToId": "admin-uuid"
}
```

### 15. Resolve Complaint (Admin)
```
POST /product-complaints/:id/resolve
```
**Body:**
```json
{
  "resolution": "Issue has been resolved by providing replacement"
}
```

### 16. Close Complaint (Admin)
```
PUT /product-complaints/:id/close
```

### 17. Reject Complaint (Admin)
```
PUT /product-complaints/:id/reject
```
**Body:**
```json
{
  "reason": "Complaint is not valid"
}
```

### 18. Update Complaint Status (Admin)
```
PUT /product-complaints/:id/status/:status
```

### 19. Update Complaint Priority (Admin)
```
PUT /product-complaints/:id/priority/:priority
```

## Complaint Types
- `QUALITY_ISSUE`: Vấn đề chất lượng
- `DAMAGED_PRODUCT`: Sản phẩm bị hư hỏng
- `WRONG_PRODUCT`: Sai sản phẩm
- `EXPIRED_PRODUCT`: Sản phẩm hết hạn
- `MISSING_ITEMS`: Thiếu hàng
- `DELIVERY_ISSUE`: Vấn đề giao hàng
- `OTHER`: Khác

## Complaint Status
- `PENDING`: Chờ xử lý
- `IN_PROGRESS`: Đang xử lý
- `RESOLVED`: Đã giải quyết
- `REJECTED`: Từ chối
- `CLOSED`: Đã đóng

## Complaint Priority
- `LOW`: Thấp
- `MEDIUM`: Trung bình
- `HIGH`: Cao
- `URGENT`: Khẩn cấp

## Permissions Required

### Product Permissions
- `READ product`: Xem sản phẩm
- `CREATE product`: Tạo sản phẩm
- `UPDATE product`: Cập nhật sản phẩm
- `DELETE product`: Xóa sản phẩm

### Product Review Permissions
- `READ product-review`: Xem đánh giá
- `CREATE product-review`: Tạo đánh giá
- `UPDATE product-review`: Cập nhật đánh giá
- `DELETE product-review`: Xóa đánh giá

### Product Complaint Permissions
- `READ product-complaint`: Xem khiếu nại
- `CREATE product-complaint`: Tạo khiếu nại
- `UPDATE product-complaint`: Cập nhật khiếu nại
- `DELETE product-complaint`: Xóa khiếu nại

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Product with ID 1 not found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
``` 