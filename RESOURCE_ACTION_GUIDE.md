# Hướng dẫn sử dụng Resource và Action trong hệ thống phân quyền

## Tại sao cần trường Resource?

### 1. **Phân biệt các loại quyền khác nhau**

Không có `resource`, bạn sẽ gặp khó khăn khi phân biệt:

```typescript
// ❌ Không có resource - mơ hồ
@RequirePermission('READ') // Đọc cái gì? User? Article? Order?

// ✅ Có resource - rõ ràng
@RequirePermission('READ', 'user')     // Đọc user
@RequirePermission('READ', 'article')  // Đọc article
@RequirePermission('READ', 'order')    // Đọc order
```

### 2. **Tránh xung đột permission**

```typescript
// Ví dụ: Cùng action READ nhưng khác resource
- READ user: Xem danh sách người dùng
- READ article: Xem danh sách bài viết  
- READ order: Xem danh sách đơn hàng
```

### 3. **Quản lý quyền chi tiết hơn**

```typescript
// Một user có thể có:
- Quyền READ user nhưng không có quyền READ article
- Quyền CREATE article nhưng không có quyền DELETE article
- Quyền UPDATE order nhưng không có quyền APPROVE order
```

## Cách xác định Resource ở Frontend

### 1. **Sử dụng Constants từ Backend**

Frontend có thể lấy danh sách resources từ API:

```typescript
// API: GET /api/permissions/constants/resources
const response = await fetch('/api/permissions/constants/resources');
const { resources, allResources } = await response.json();

// Kết quả:
{
  "resources": {
    "USER": "user",
    "ROLE": "role",
    "ARTICLE": "article",
    "ORDER": "order",
    // ...
  },
  "allResources": ["user", "role", "article", "order", ...]
}
```

### 2. **Sử dụng Permission Templates**

```typescript
// API: GET /api/permissions/constants/templates
const response = await fetch('/api/permissions/constants/templates');
const { templates } = await response.json();

// Kết quả:
{
  "templates": {
    "user": {
      "name": "Quản lý người dùng",
      "permissions": [
        { "action": "READ", "name": "Xem danh sách người dùng", "code": "USER_READ" },
        { "action": "CREATE", "name": "Tạo người dùng mới", "code": "USER_CREATE" },
        // ...
      ]
    },
    "article": {
      "name": "Quản lý bài viết",
      "permissions": [
        { "action": "READ", "name": "Xem bài viết", "code": "ARTICLE_READ" },
        { "action": "CREATE", "name": "Tạo bài viết mới", "code": "ARTICLE_CREATE" },
        // ...
      ]
    }
  }
}
```

### 3. **Tạo Permission từ Template**

```typescript
// API: POST /api/permissions/create-from-template
const response = await fetch('/api/permissions/create-from-template', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    resource: 'user',
    selectedActions: ['READ', 'CREATE', 'UPDATE']
  })
});

// Tự động tạo 3 permission:
// - USER_READ
// - USER_CREATE  
// - USER_UPDATE
```

## Quy trình gán quyền ở Frontend

### Bước 1: Lấy danh sách Resources và Actions

```typescript
const [resources, setResources] = useState({});
const [templates, setTemplates] = useState({});

useEffect(() => {
  // Lấy resources
  fetch('/api/permissions/constants/resources')
    .then(res => res.json())
    .then(data => setResources(data.resources));
    
  // Lấy templates
  fetch('/api/permissions/constants/templates')
    .then(res => res.json())
    .then(data => setTemplates(data.templates));
}, []);
```

### Bước 2: Hiển thị UI cho người dùng chọn

```typescript
// Dropdown chọn Resource
<Select onValueChange={setSelectedResource}>
  <SelectTrigger>
    <SelectValue placeholder="Chọn resource..." />
  </SelectTrigger>
  <SelectContent>
    {Object.entries(resources).map(([key, value]) => (
      <SelectItem key={key} value={value}>
        {getResourceDisplayName(value)} {/* "Người dùng", "Bài viết", etc. */}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

// Checkbox chọn Actions
{selectedResource && templates[selectedResource]?.permissions.map(permission => (
  <Checkbox
    key={permission.action}
    checked={selectedActions.includes(permission.action)}
    onCheckedChange={() => toggleAction(permission.action)}
  >
    {permission.name} {/* "Xem danh sách người dùng", etc. */}
  </Checkbox>
))}
```

### Bước 3: Tạo Permission

```typescript
const handleCreatePermissions = async () => {
  const response = await fetch('/api/permissions/create-from-template', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resource: selectedResource,
      selectedActions: selectedActions
    })
  });
  
  const result = await response.json();
  // result chứa danh sách permission đã tạo
};
```

## Mapping Resource với Feature

### 1. **Liên kết Permission với Feature**

```typescript
// Khi tạo permission, có thể liên kết với feature
const createDto: CreatePermissionDto = {
  name: "Xem danh sách người dùng",
  code: "USER_READ",
  action: "READ",
  resource: "user",
  featureId: 1, // ID của feature "Quản lý người dùng"
  isActive: true
};
```

### 2. **Kiểm tra quyền truy cập Feature**

```typescript
// Kiểm tra user có quyền truy cập feature không
const hasFeatureAccess = await roleService.hasPermission(
  userRoleId, 
  'READ', 
  'user'
);

if (hasFeatureAccess) {
  // Hiển thị menu "Quản lý người dùng"
  showUserManagementMenu();
}
```

## Ví dụ thực tế

### Scenario: Tạo quyền cho module "Quản lý bài viết"

1. **Người dùng chọn Resource**: `article`
2. **Hệ thống hiển thị các Actions có sẵn**:
   - ✅ Xem bài viết (READ)
   - ✅ Tạo bài viết mới (CREATE)
   - ✅ Cập nhật bài viết (UPDATE)
   - ✅ Xóa bài viết (DELETE)
   - ✅ Xuất bản bài viết (PUBLISH)
   - ✅ Nhập bài viết (IMPORT)
   - ✅ Xuất bài viết (EXPORT)

3. **Người dùng chọn**: READ, CREATE, UPDATE, PUBLISH
4. **Hệ thống tạo 4 permission**:
   - `ARTICLE_READ`
   - `ARTICLE_CREATE`
   - `ARTICLE_UPDATE`
   - `ARTICLE_PUBLISH`

5. **Gán permission cho Role**: "Editor"
6. **Kết quả**: Role "Editor" có thể xem, tạo, cập nhật và xuất bản bài viết, nhưng không thể xóa hoặc import/export

## Best Practices

### 1. **Đặt tên Resource nhất quán**
```typescript
// ✅ Tốt
user, article, order, payment

// ❌ Tránh
users, articles, orders, payments
```

### 2. **Sử dụng Action chuẩn**
```typescript
// ✅ Actions chuẩn
CREATE, READ, UPDATE, DELETE, APPROVE, REJECT

// ❌ Tránh tạo action tùy ý
VIEW, EDIT, REMOVE, CANCEL
```

### 3. **Tạo Permission Template cho Resource mới**
```typescript
// Khi thêm resource mới, cập nhật PERMISSION_TEMPLATES
[RESOURCES.NEW_RESOURCE]: {
  name: 'Quản lý Resource mới',
  permissions: [
    { action: ACTIONS.READ, name: 'Xem Resource mới', code: 'NEW_RESOURCE_READ' },
    { action: ACTIONS.CREATE, name: 'Tạo Resource mới', code: 'NEW_RESOURCE_CREATE' },
    // ...
  ]
}
```

### 4. **Validation ở Frontend**
```typescript
// Kiểm tra resource hợp lệ
const isValidResource = (resource: string) => {
  return Object.values(RESOURCES).includes(resource);
};

// Kiểm tra action hợp lệ
const isValidAction = (action: string) => {
  return Object.values(ACTIONS).includes(action);
};
```

## Lợi ích của hệ thống Resource-Action

1. **Rõ ràng**: Biết chính xác quyền áp dụng cho resource nào
2. **Linh hoạt**: Có thể gán quyền chi tiết cho từng resource
3. **Dễ quản lý**: Template có sẵn, không cần nhớ tên permission
4. **Mở rộng**: Dễ dàng thêm resource và action mới
5. **Tương thích**: Vẫn hỗ trợ hệ thống permission cũ 