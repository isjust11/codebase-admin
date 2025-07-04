# Hệ thống Phân quyền theo Action và Resource

## Tổng quan

Hệ thống phân quyền mới cho phép phân quyền chi tiết theo **Action** và **Resource**, tương ứng với **Feature** và **Permission**. Điều này giúp kiểm soát quyền truy cập một cách linh hoạt và chính xác hơn.

## Cấu trúc dữ liệu

### Permission Entity
```typescript
{
  id: number;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  action?: string;        // CREATE, READ, UPDATE, DELETE, etc.
  resource?: string;      // user, role, permission, feature, etc.
  featureId?: number;     // Liên kết với Feature
  feature?: Feature;      // Relation với Feature
}
```

### Feature Entity
```typescript
{
  id: number;
  label: string;
  link?: string;
  // ... other fields
  permissions?: Permission[]; // Relation với Permission
}
```

## Cách sử dụng

### 1. Decorator cơ bản

#### RequirePermission (Một permission)
```typescript
@RequirePermission('READ', 'user')
async findAll(): Promise<User[]> {
  return this.userService.findAll();
}
```

#### RequirePermissionsAction (Nhiều permission - OR logic)
```typescript
@RequirePermissionsAction(
  { action: 'READ', resource: 'user' },
  { action: 'READ', resource: 'profile' }
)
async getUserProfile(): Promise<User> {
  // Cần có ít nhất một trong hai permission
}
```

#### RequirePermissions (Tương thích ngược)
```typescript
@RequirePermissions('ADMIN')
async adminOnly(): Promise<void> {
  // Sử dụng code permission cũ
}
```

### 2. Các Action phổ biến

- **CREATE**: Tạo mới resource
- **READ**: Đọc/xem resource
- **UPDATE**: Cập nhật resource
- **DELETE**: Xóa resource
- **EXPORT**: Xuất dữ liệu
- **IMPORT**: Nhập dữ liệu
- **APPROVE**: Phê duyệt
- **REJECT**: Từ chối

### 3. Các Resource phổ biến

- **user**: Quản lý người dùng
- **role**: Quản lý vai trò
- **permission**: Quản lý quyền
- **feature**: Quản lý tính năng
- **article**: Quản lý bài viết
- **category**: Quản lý danh mục
- **order**: Quản lý đơn hàng
- **payment**: Quản lý thanh toán

## Ví dụ thực tế

### User Controller
```typescript
@Controller('users')
@UseGuards(PermissionGuard)
@UseGuards(JwtAuthGuard)
export class UserController {
  
  @Get()
  @RequirePermission('READ', 'user')
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Post()
  @RequirePermission('CREATE', 'user')
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.create(createUserDto);
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'user')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<User> {
    return this.userService.update(parseInt(id), updateUserDto);
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'user')
  async remove(@Param('id') id: string): Promise<void> {
    return this.userService.remove(parseInt(id));
  }

  @Put(':id/block')
  @RequirePermission('UPDATE', 'user')
  async blockUser(@Param('id') id: string): Promise<User> {
    return this.userService.blockUser(parseInt(id));
  }
}
```

### Article Controller
```typescript
@Controller('articles')
@UseGuards(PermissionGuard)
@UseGuards(JwtAuthGuard)
export class ArticleController {
  
  @Get()
  @RequirePermission('READ', 'article')
  async findAll(): Promise<Article[]> {
    return this.articleService.findAll();
  }

  @Post()
  @RequirePermission('CREATE', 'article')
  async create(@Body() createArticleDto: CreateArticleDto): Promise<Article> {
    return this.articleService.create(createArticleDto);
  }

  @Put(':id/publish')
  @RequirePermission('UPDATE', 'article')
  async publish(@Param('id') id: string): Promise<Article> {
    return this.articleService.publish(parseInt(id));
  }

  @Post('import')
  @RequirePermission('IMPORT', 'article')
  async importArticles(@Body() importData: any): Promise<void> {
    return this.articleService.import(importData);
  }

  @Get('export')
  @RequirePermission('EXPORT', 'article')
  async exportArticles(): Promise<any> {
    return this.articleService.export();
  }
}
```

## Tạo Permission trong Database

### 1. Permission cơ bản cho User
```sql
INSERT INTO permission (name, code, action, resource, description) VALUES
('Xem danh sách người dùng', 'USER_READ', 'READ', 'user', 'Quyền xem danh sách người dùng'),
('Tạo người dùng mới', 'USER_CREATE', 'CREATE', 'user', 'Quyền tạo người dùng mới'),
('Cập nhật thông tin người dùng', 'USER_UPDATE', 'UPDATE', 'user', 'Quyền cập nhật thông tin người dùng'),
('Xóa người dùng', 'USER_DELETE', 'DELETE', 'user', 'Quyền xóa người dùng'),
('Khóa người dùng', 'USER_BLOCK', 'UPDATE', 'user', 'Quyền khóa/mở khóa người dùng');
```

### 2. Permission cho Article
```sql
INSERT INTO permission (name, code, action, resource, description) VALUES
('Xem bài viết', 'ARTICLE_READ', 'READ', 'article', 'Quyền xem bài viết'),
('Tạo bài viết', 'ARTICLE_CREATE', 'CREATE', 'article', 'Quyền tạo bài viết mới'),
('Cập nhật bài viết', 'ARTICLE_UPDATE', 'UPDATE', 'article', 'Quyền cập nhật bài viết'),
('Xóa bài viết', 'ARTICLE_DELETE', 'DELETE', 'article', 'Quyền xóa bài viết'),
('Xuất bản bài viết', 'ARTICLE_PUBLISH', 'UPDATE', 'article', 'Quyền xuất bản bài viết'),
('Nhập bài viết', 'ARTICLE_IMPORT', 'IMPORT', 'article', 'Quyền nhập bài viết từ file'),
('Xuất bài viết', 'ARTICLE_EXPORT', 'EXPORT', 'article', 'Quyền xuất bài viết ra file');
```

## Kiểm tra Permission trong Service

```typescript
@Injectable()
export class UserService {
  constructor(
    private roleService: RoleService,
  ) {}

  async updateUser(userId: number, updateData: any, currentUser: any): Promise<User> {
    // Kiểm tra quyền UPDATE user
    const hasPermission = await this.roleService.hasPermission(
      currentUser.roles[0].id, 
      'UPDATE', 
      'user'
    );

    if (!hasPermission) {
      throw new ForbiddenException('Không có quyền cập nhật người dùng');
    }

    // Thực hiện cập nhật
    return this.userRepository.save(updateData);
  }
}
```

## Migration

Chạy migration để cập nhật database:

```bash
npm run migration:run
```

## Lưu ý

1. **Tương thích ngược**: Hệ thống vẫn hỗ trợ decorator `@RequirePermissions` cũ
2. **Admin role**: Role có code 'ADMIN' sẽ có tất cả quyền
3. **Feature mapping**: Permission có thể được liên kết với Feature để quản lý menu
4. **Performance**: Permission được cache trong role để tối ưu hiệu suất

## Best Practices

1. **Đặt tên action rõ ràng**: Sử dụng các action chuẩn như CREATE, READ, UPDATE, DELETE
2. **Đặt tên resource nhất quán**: Sử dụng tên resource ngắn gọn và dễ hiểu
3. **Kiểm tra permission trong service**: Không chỉ dựa vào guard, cũng kiểm tra trong service
4. **Logging**: Ghi log các hoạt động liên quan đến permission để audit
5. **Testing**: Viết test cho các permission để đảm bảo hoạt động đúng 