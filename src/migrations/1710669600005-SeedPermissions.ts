import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedPermissions1710669600005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Seed permissions cho User management
    await queryRunner.query(`
      INSERT INTO permission (name, code, action, resource, description, isActive) VALUES
      ('Xem danh sách người dùng', 'USER_READ', 'READ', 'user', 'Quyền xem danh sách người dùng', true),
      ('Tạo người dùng mới', 'USER_CREATE', 'CREATE', 'user', 'Quyền tạo người dùng mới', true),
      ('Cập nhật thông tin người dùng', 'USER_UPDATE', 'UPDATE', 'user', 'Quyền cập nhật thông tin người dùng', true),
      ('Xóa người dùng', 'USER_DELETE', 'DELETE', 'user', 'Quyền xóa người dùng', true),
      ('Khóa/Mở khóa người dùng', 'USER_BLOCK', 'UPDATE', 'user', 'Quyền khóa/mở khóa người dùng', true)
    `);

    // Seed permissions cho Role management
    await queryRunner.query(`
      INSERT INTO permission (name, code, action, resource, description, isActive) VALUES
      ('Xem danh sách vai trò', 'ROLE_READ', 'READ', 'role', 'Quyền xem danh sách vai trò', true),
      ('Tạo vai trò mới', 'ROLE_CREATE', 'CREATE', 'role', 'Quyền tạo vai trò mới', true),
      ('Cập nhật vai trò', 'ROLE_UPDATE', 'UPDATE', 'role', 'Quyền cập nhật vai trò', true),
      ('Xóa vai trò', 'ROLE_DELETE', 'DELETE', 'role', 'Quyền xóa vai trò', true),
      ('Phân quyền cho vai trò', 'ROLE_ASSIGN_PERMISSION', 'UPDATE', 'role', 'Quyền phân quyền cho vai trò', true)
    `);

    // Seed permissions cho Permission management
    await queryRunner.query(`
      INSERT INTO permission (name, code, action, resource, description, isActive) VALUES
      ('Xem danh sách quyền', 'PERMISSION_READ', 'READ', 'permission', 'Quyền xem danh sách quyền', true),
      ('Tạo quyền mới', 'PERMISSION_CREATE', 'CREATE', 'permission', 'Quyền tạo quyền mới', true),
      ('Cập nhật quyền', 'PERMISSION_UPDATE', 'UPDATE', 'permission', 'Quyền cập nhật quyền', true),
      ('Xóa quyền', 'PERMISSION_DELETE', 'DELETE', 'permission', 'Quyền xóa quyền', true)
    `);

    // Seed permissions cho Feature management
    await queryRunner.query(`
      INSERT INTO permission (name, code, action, resource, description, isActive) VALUES
      ('Xem danh sách tính năng', 'FEATURE_READ', 'READ', 'feature', 'Quyền xem danh sách tính năng', true),
      ('Tạo tính năng mới', 'FEATURE_CREATE', 'CREATE', 'feature', 'Quyền tạo tính năng mới', true),
      ('Cập nhật tính năng', 'FEATURE_UPDATE', 'UPDATE', 'feature', 'Quyền cập nhật tính năng', true),
      ('Xóa tính năng', 'FEATURE_DELETE', 'DELETE', 'feature', 'Quyền xóa tính năng', true)
    `);

    // Seed permissions cho Article management
    await queryRunner.query(`
      INSERT INTO permission (name, code, action, resource, description, isActive) VALUES
      ('Xem bài viết', 'ARTICLE_READ', 'READ', 'article', 'Quyền xem bài viết', true),
      ('Tạo bài viết', 'ARTICLE_CREATE', 'CREATE', 'article', 'Quyền tạo bài viết mới', true),
      ('Cập nhật bài viết', 'ARTICLE_UPDATE', 'UPDATE', 'article', 'Quyền cập nhật bài viết', true),
      ('Xóa bài viết', 'ARTICLE_DELETE', 'DELETE', 'article', 'Quyền xóa bài viết', true),
      ('Xuất bản bài viết', 'ARTICLE_PUBLISH', 'UPDATE', 'article', 'Quyền xuất bản bài viết', true),
      ('Nhập bài viết', 'ARTICLE_IMPORT', 'IMPORT', 'article', 'Quyền nhập bài viết từ file', true),
      ('Xuất bài viết', 'ARTICLE_EXPORT', 'EXPORT', 'article', 'Quyền xuất bài viết ra file', true)
    `);

    // Seed permissions cho Category management
    await queryRunner.query(`
      INSERT INTO permission (name, code, action, resource, description, isActive) VALUES
      ('Xem danh mục', 'CATEGORY_READ', 'READ', 'category', 'Quyền xem danh mục', true),
      ('Tạo danh mục', 'CATEGORY_CREATE', 'CREATE', 'category', 'Quyền tạo danh mục mới', true),
      ('Cập nhật danh mục', 'CATEGORY_UPDATE', 'UPDATE', 'category', 'Quyền cập nhật danh mục', true),
      ('Xóa danh mục', 'CATEGORY_DELETE', 'DELETE', 'category', 'Quyền xóa danh mục', true)
    `);

    // Seed permissions cho Order management
    await queryRunner.query(`
      INSERT INTO permission (name, code, action, resource, description, isActive) VALUES
      ('Xem đơn hàng', 'ORDER_READ', 'READ', 'order', 'Quyền xem đơn hàng', true),
      ('Tạo đơn hàng', 'ORDER_CREATE', 'CREATE', 'order', 'Quyền tạo đơn hàng mới', true),
      ('Cập nhật đơn hàng', 'ORDER_UPDATE', 'UPDATE', 'order', 'Quyền cập nhật đơn hàng', true),
      ('Xóa đơn hàng', 'ORDER_DELETE', 'DELETE', 'order', 'Quyền xóa đơn hàng', true),
      ('Phê duyệt đơn hàng', 'ORDER_APPROVE', 'APPROVE', 'order', 'Quyền phê duyệt đơn hàng', true),
      ('Từ chối đơn hàng', 'ORDER_REJECT', 'REJECT', 'order', 'Quyền từ chối đơn hàng', true)
    `);

    // Seed permissions cho Payment management
    await queryRunner.query(`
      INSERT INTO permission (name, code, action, resource, description, isActive) VALUES
      ('Xem thanh toán', 'PAYMENT_READ', 'READ', 'payment', 'Quyền xem thanh toán', true),
      ('Tạo thanh toán', 'PAYMENT_CREATE', 'CREATE', 'payment', 'Quyền tạo thanh toán mới', true),
      ('Cập nhật thanh toán', 'PAYMENT_UPDATE', 'UPDATE', 'payment', 'Quyền cập nhật thanh toán', true),
      ('Xóa thanh toán', 'PAYMENT_DELETE', 'DELETE', 'payment', 'Quyền xóa thanh toán', true),
      ('Phê duyệt thanh toán', 'PAYMENT_APPROVE', 'APPROVE', 'payment', 'Quyền phê duyệt thanh toán', true),
      ('Từ chối thanh toán', 'PAYMENT_REJECT', 'REJECT', 'payment', 'Quyền từ chối thanh toán', true)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Xóa tất cả permissions đã tạo
    await queryRunner.query(`DELETE FROM permission WHERE action IS NOT NULL`);
  }
} 