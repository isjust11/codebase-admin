// Định nghĩa các Resource chuẩn
export const RESOURCES = {
  USER: 'USER',
  ROLE: 'ROLE',
  PERMISSION: 'PERMISSION',
  FEATURE: 'FEATURE',
  ARTICLE: 'ARTICLE',
  CATEGORY: 'CATEGORY',
  MEDIA: 'MEDIA',
  NOTIFICATION: 'NOTIFICATION',
  CATEGORY_TYPE: 'CATEGORY_TYPE',
  STATIC_PAGE: 'STATIC_PAGE',
} as const;

// Định nghĩa các Action chuẩn
export const ACTIONS = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  PUBLISH: 'PUBLISH',
  BLOCK: 'BLOCK',
  UNBLOCK: 'UNBLOCK',
  ASSIGN: 'ASSIGN',
  UPLOAD: 'UPLOAD',
  DOWNLOAD: 'DOWNLOAD',
} as const;

// Định nghĩa Permission Template cho từng Resource
export const PERMISSION_TEMPLATES = {
  [RESOURCES.USER]: {
    name: 'Quản lý người dùng',
    permissions: [
      { action: ACTIONS.READ, name: 'Xem danh sách người dùng', code: 'USER_READ' },
      { action: ACTIONS.CREATE, name: 'Tạo người dùng mới', code: 'USER_CREATE' },
      { action: ACTIONS.UPDATE, name: 'Cập nhật thông tin người dùng', code: 'USER_UPDATE' },
      { action: ACTIONS.DELETE, name: 'Xóa người dùng', code: 'USER_DELETE' },
      { action: ACTIONS.BLOCK, name: 'Khóa người dùng', code: 'USER_BLOCK' },
      { action: ACTIONS.UNBLOCK, name: 'Mở khóa người dùng', code: 'USER_UNBLOCK' },
    ]
  },
  [RESOURCES.ROLE]: {
    name: 'Quản lý vai trò',
    permissions: [
      { action: ACTIONS.READ, name: 'Xem danh sách vai trò', code: 'ROLE_READ' },
      { action: ACTIONS.CREATE, name: 'Tạo vai trò mới', code: 'ROLE_CREATE' },
      { action: ACTIONS.UPDATE, name: 'Cập nhật vai trò', code: 'ROLE_UPDATE' },
      { action: ACTIONS.DELETE, name: 'Xóa vai trò', code: 'ROLE_DELETE' },
      { action: ACTIONS.ASSIGN, name: 'Phân quyền cho vai trò', code: 'ROLE_ASSIGN_PERMISSION' },
    ]
  },
  [RESOURCES.ARTICLE]: {
    name: 'Quản lý bài viết',
    permissions: [
      { action: ACTIONS.READ, name: 'Xem bài viết', code: 'ARTICLE_READ' },
      { action: ACTIONS.CREATE, name: 'Tạo bài viết mới', code: 'ARTICLE_CREATE' },
      { action: ACTIONS.UPDATE, name: 'Cập nhật bài viết', code: 'ARTICLE_UPDATE' },
      { action: ACTIONS.DELETE, name: 'Xóa bài viết', code: 'ARTICLE_DELETE' },
      { action: ACTIONS.PUBLISH, name: 'Xuất bản bài viết', code: 'ARTICLE_PUBLISH' },
      { action: ACTIONS.IMPORT, name: 'Nhập bài viết', code: 'ARTICLE_IMPORT' },
      { action: ACTIONS.EXPORT, name: 'Xuất bài viết', code: 'ARTICLE_EXPORT' },
    ]
  },
  [RESOURCES.CATEGORY]: {
    name: 'Quản lý danh mục',
    permissions: [
      { action: ACTIONS.READ, name: 'Xem danh mục', code: 'CATEGORY_READ' },
      { action: ACTIONS.CREATE, name: 'Tạo danh mục', code: 'CATEGORY_CREATE' },
      { action: ACTIONS.UPDATE, name: 'Cập nhật danh mục', code: 'CATEGORY_UPDATE' },
      { action: ACTIONS.DELETE, name: 'Xóa danh mục', code: 'CATEGORY_DELETE' },
    ]
  },
  [RESOURCES.FEATURE]: {
    name: 'Quản lý tính năng',
    permissions: [
      { action: ACTIONS.READ, name: 'Xem tính năng', code: 'FEATURE_READ' },
      { action: ACTIONS.CREATE, name: 'Tạo tính năng', code: 'FEATURE_CREATE' },
      { action: ACTIONS.UPDATE, name: 'Cập nhật tính năng', code: 'FEATURE_UPDATE' },
      { action: ACTIONS.DELETE, name: 'Xóa tính năng', code: 'FEATURE_DELETE' },
    ]
  },
  [RESOURCES.PERMISSION]: {
    name: 'Quản lý quyền',
    permissions: [
      { action: ACTIONS.READ, name: 'Xem quyền', code: 'PERMISSION_READ' },
      { action: ACTIONS.CREATE, name: 'Tạo quyền', code: 'PERMISSION_CREATE' },
      { action: ACTIONS.UPDATE, name: 'Cập nhật quyền', code: 'PERMISSION_UPDATE' },
      { action: ACTIONS.DELETE, name: 'Xóa quyền', code: 'PERMISSION_DELETE' },
    ]
  },
  [RESOURCES.CATEGORY_TYPE]: {
    name: 'Quản lý loại danh mục',
    permissions: [
      { action: ACTIONS.READ, name: 'Xem loại danh mục', code: 'CATEGORY_TYPE_READ' },
      { action: ACTIONS.CREATE, name: 'Tạo loại danh mục', code: 'CATEGORY_TYPE_CREATE' },
      { action: ACTIONS.UPDATE, name: 'Cập nhật loại danh mục', code: 'CATEGORY_TYPE_UPDATE' },
      { action: ACTIONS.DELETE, name: 'Xóa loại danh mục', code: 'CATEGORY_TYPE_DELETE' },
    ]
  },
  [RESOURCES.MEDIA]: {
    name: 'Quản lý media',
    permissions: [
      { action: ACTIONS.READ, name: 'Xem media', code: 'MEDIA_READ' },
      { action: ACTIONS.CREATE, name: 'Tạo media', code: 'MEDIA_CREATE' },
      { action: ACTIONS.UPDATE, name: 'Cập nhật media', code: 'MEDIA_UPDATE' },
      { action: ACTIONS.DELETE, name: 'Xóa media', code: 'MEDIA_DELETE' },
      { action: ACTIONS.UPLOAD, name: 'Tải lên media', code: 'MEDIA_UPLOAD' },
      { action: ACTIONS.DOWNLOAD, name: 'Tải xuống media', code: 'MEDIA_DOWNLOAD' },
    ]
  },
  [RESOURCES.NOTIFICATION]: {
    name: 'Quản lý thông báo',
    permissions: [
      { action: ACTIONS.READ, name: 'Xem thông báo', code: 'NOTIFICATION_READ' },
      { action: ACTIONS.CREATE, name: 'Tạo thông báo', code: 'NOTIFICATION_CREATE' },
      { action: ACTIONS.UPDATE, name: 'Cập nhật thông báo', code: 'NOTIFICATION_UPDATE' },
      { action: ACTIONS.DELETE, name: 'Xóa thông báo', code: 'NOTIFICATION_DELETE' },
    ]
  },
  [RESOURCES.STATIC_PAGE]: {
    name: 'Quản lý trang tĩnh',
    permissions: [
      { action: ACTIONS.READ, name: 'Xem trang tĩnh', code: 'STATIC_PAGE_READ' },
      { action: ACTIONS.CREATE, name: 'Tạo trang tĩnh', code: 'STATIC_PAGE_CREATE' },
      { action: ACTIONS.UPDATE, name: 'Cập nhật trang tĩnh', code: 'STATIC_PAGE_UPDATE' },
      { action: ACTIONS.DELETE, name: 'Xóa trang tĩnh', code: 'STATIC_PAGE_DELETE' },
      { action: ACTIONS.PUBLISH, name: 'Xuất bản trang tĩnh', code: 'STATIC_PAGE_PUBLISH' },
    ]
  },
} as const;

// Helper function để lấy tất cả resources
export const getAllResources = () => Object.values(RESOURCES);

// Helper function để lấy tất cả actions
export const getAllActions = () => Object.values(ACTIONS);

// Helper function để lấy permission template cho một resource
export const getPermissionTemplate = (resource: string) => {
  return PERMISSION_TEMPLATES[resource as keyof typeof PERMISSION_TEMPLATES];
};

// Helper function để tạo permission code
export const createPermissionCode = (action: string, resource: string) => {
  return `${resource.toUpperCase()}_${action}`;
}; 