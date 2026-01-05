
import { MigrationInterface, QueryRunner } from 'typeorm';
import { RoleEnum } from 'src/enums/role.enum';
import { CategoryTypeEnum } from 'src/enums/category-type.enum';
import { RESOURCES } from 'src/constants/permission.constants';
import { CategoryCodeEnum } from 'src/enums/category-code.enum';

export class SeedsCommonData1710669600002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Insert roles
        await queryRunner.query(`
            INSERT INTO role ( name, code, description, isActive) VALUES
            ('Quản trị viên', '${RoleEnum.ADMIN}', 'Quản trị viên hệ thống', true),
            ('Quản lý hệ thống', '${RoleEnum.SUPPER_ADMIN}', 'Quản lý hệ thống', true),
            ('Người dùng', '${RoleEnum.USER}', 'Người dùng', true)
        `);

        // Insert category types
        await queryRunner.query(`
            INSERT INTO category_type (name, code, description, isActive) VALUES
            ('Menu chức năng', '${CategoryTypeEnum.FEATURE_TYPE}', 'Danh mục các chức năng trong hệ thống', true)
        `);

        // Lấy category type ID cho FEATURE_TYPE
        const featureTypeResult = await queryRunner.query(`
            SELECT id FROM category_type WHERE code = '${CategoryTypeEnum.FEATURE_TYPE}'
        `);
        const featureTypeId = featureTypeResult[0].id;

        // Insert categories cho FEATURE_TYPE
        await queryRunner.query(`
            INSERT INTO category (name, code, description, categoryTypeId,sortOrder , isActive) VALUES
            ('Menu', '${CategoryCodeEnum.FEATURE_MENU}', 'Menu chức năng chính', '${featureTypeId}',1, true),
            ('Khác', '${CategoryCodeEnum.FEATURE_OTHERS}', 'Các chức năng khác', '${featureTypeId}',2,true)
        `);

        // Lấy category ID cho Menu
        const menuCategoryResult = await queryRunner.query(`
            SELECT id FROM category WHERE code = '${CategoryCodeEnum.FEATURE_MENU}'
        `);
        const menuCategoryId = menuCategoryResult[0].id;

         // Lấy category ID cho Menu
        const otherCategoryResult = await queryRunner.query(`
            SELECT id FROM category WHERE code = '${CategoryCodeEnum.FEATURE_OTHERS}'
        `);
        const otherCategoryId = otherCategoryResult[0].id;

        // Insert chức năng quản trị
        await queryRunner.query(`
            INSERT INTO feature (label, link, icon, iconType, parentId, isActive, iconSize,featureTypeId, createdAt, updatedAt) VALUES
            ('Quản trị', '/admin', 'Plug2', 'lucide', null, true, 20,'${menuCategoryId}' , CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `);

        const featureAdminResult = await queryRunner.query(`
            SELECT id FROM feature WHERE link = '/admin'
        `);
        const featureAdminId = featureAdminResult[0].id;

        // Insert các chức năng con của quản trị
        await queryRunner.query(`
            INSERT INTO feature (label, link,  parentId, isActive) VALUES
            ('Chức năng', '/manager/admin/feature', '${featureAdminId}', true),
            ( 'Vai trò', '/manager/admin/roles', '${featureAdminId}', true),
            ( 'Phân quyền', '/manager/admin/permissions', '${featureAdminId}', true)
        `);

         // Insert chức năng khác
        await queryRunner.query(`
            INSERT INTO feature (label, link, icon, iconType, parentId, isActive, iconSize,featureTypeId, createdAt, updatedAt) VALUES
            ('Danh mục', '/manager/cat', 'Dice4', 'lucide', null, true, 20,'${otherCategoryId}' , CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `);

        const featureCatResult = await queryRunner.query(`
            SELECT id FROM feature WHERE link = '/manager/cat'
        `);
        const featureCatId = featureCatResult[0].id;

        // Insert các chức năng con của quản trị
        await queryRunner.query(`
            INSERT INTO feature (label, link,  parentId, isActive) VALUES
            ('Danh mục', '/manager/categories', '${featureCatId}', true),
            ('Loại danh mục', '/manager/category-types', '${featureCatId}', true)
        `);

         const categoryResult = await queryRunner.query(`
            SELECT id FROM feature WHERE link = '/manager/categories'
        `);
        const categoryId = categoryResult[0].id;

        const categoryType = await queryRunner.query(`
            SELECT id FROM feature WHERE link = '/manager/category-types'
        `);
        const categoryTypeId = categoryType[0].id;

        const featureResult = await queryRunner.query(`
            SELECT id FROM feature WHERE link = '/manager/admin/feature'
        `);
        const featureId = featureResult[0].id;

        const roleResult = await queryRunner.query(`
            SELECT id FROM feature WHERE link = '/manager/admin/roles'
        `);
        const roleId = roleResult[0].id;

        const permissionMenu = await queryRunner.query(`
            SELECT id FROM feature WHERE link = '/manager/admin/permissions'
        `);
        const permissionId = permissionMenu[0].id;

        // Lấy role admin
        const superAdminRoleResult = await queryRunner.query(`
            SELECT id FROM role WHERE code = '${RoleEnum.SUPPER_ADMIN}'
        `);
        const superAdminRoleId = superAdminRoleResult[0].id;

        // Gán quyền cho role admin
        await queryRunner.query(`
            INSERT INTO role_features (roleId, featureId) VALUES
            ('${superAdminRoleId}', '${featureAdminId}'),
            ('${superAdminRoleId}', '${roleId}'),
            ('${superAdminRoleId}', '${featureId}'),
            ('${superAdminRoleId}', '${permissionId}'),
            ('${superAdminRoleId}', '${featureCatId}'),
            ('${superAdminRoleId}', '${categoryId}'),
            ('${superAdminRoleId}', '${categoryTypeId}')
        `);

        // insert permission
        await queryRunner.query(`
            INSERT INTO permission (name, code, description, isActive, action, resource) VALUES
            ('Quản lý người dùng', 'USER_READ', 'Xem danh sách người dùng', true, 'READ', '${RESOURCES.USER}'),
            ('Quản lý người dùng', 'USER_CREATE', 'Tạo người dùng mới', true, 'CREATE', '${RESOURCES.USER}'),
            ('Quản lý người dùng', 'USER_UPDATE', 'Cập nhật thông tin người dùng', true, 'UPDATE', '${RESOURCES.USER}'),
            ('Quản lý người dùng', 'USER_DELETE', 'Xóa người dùng', true, 'DELETE', '${RESOURCES.USER}'),
            ('Quản lý người dùng', 'USER_BLOCK', 'Khóa người dùng', true, 'BLOCK', '${RESOURCES.USER}'),
            ('Quản lý người dùng', 'USER_UNBLOCK', 'Mở khóa người dùng', true, 'UNBLOCK', '${RESOURCES.USER}'),
            ('Quản lý vai trò', 'ROLE_READ', 'Xem danh sách vai trò', true, 'READ', '${RESOURCES.ROLE}'),
            ('Quản lý vai trò', 'ROLE_CREATE', 'Tạo vai trò mới', true, 'CREATE', '${RESOURCES.ROLE}'),
            ('Quản lý vai trò', 'ROLE_UPDATE', 'Cập nhật thông tin vai trò', true, 'UPDATE', '${RESOURCES.ROLE}'),
            ('Quản lý vai trò', 'ROLE_DELETE', 'Xóa vai trò', true, 'DELETE', '${RESOURCES.ROLE}'),
            ('Quản lý phân quyền', 'PERMISSION_READ', 'Xem danh sách phân quyền', true, 'READ', '${RESOURCES.PERMISSION}'),
            ('Quản lý phân quyền', 'PERMISSION_CREATE', 'Tạo phân quyền mới', true, 'CREATE', '${RESOURCES.PERMISSION}'),
            ('Quản lý phân quyền', 'PERMISSION_UPDATE', 'Cập nhật thông tin phân quyền', true, 'UPDATE', '${RESOURCES.PERMISSION}'),
            ('Quản lý phân quyền', 'PERMISSION_DELETE', 'Xóa phân quyền', true, 'DELETE', '${RESOURCES.PERMISSION}'),
            ('Quản lý chức năng', 'FEATURE_READ', 'Xem danh sách chức năng', true, 'READ', '${RESOURCES.FEATURE}'),
            ('Quản lý chức năng', 'FEATURE_CREATE', 'Tạo chức năng mới', true, 'CREATE', '${RESOURCES.FEATURE}'),
            ('Quản lý chức năng', 'FEATURE_UPDATE', 'Cập nhật thông tin chức năng', true, 'UPDATE', '${RESOURCES.FEATURE}'),
            ('Quản lý chức năng', 'FEATURE_DELETE', 'Xóa chức năng', true, 'DELETE', '${RESOURCES.FEATURE}'),
            ('Quản lý danh mục', 'CATEGORY_READ', 'Xem danh sách danh mục', true, 'READ', '${RESOURCES.CATEGORY}'),
            ('Quản lý danh mục', 'CATEGORY_CREATE', 'Tạo danh mục mới', true, 'CREATE', '${RESOURCES.CATEGORY}'),
            ('Quản lý danh mục', 'CATEGORY_UPDATE', 'Cập nhật thông tin danh mục', true, 'UPDATE', '${RESOURCES.CATEGORY}'),
            ('Quản lý danh mục', 'CATEGORY_DELETE', 'Xóa danh mục', true, 'DELETE', '${RESOURCES.CATEGORY}'),
            ('Quản lý loại danh mục', 'CATEGORY_TYPE_READ', 'Xem danh sách loại danh mục', true, 'READ', '${RESOURCES.CATEGORY_TYPE}'),
            ('Quản lý loại danh mục', 'CATEGORY_TYPE_CREATE', 'Tạo loại danh mục mới', true, 'CREATE', '${RESOURCES.CATEGORY_TYPE}'),
            ('Quản lý loại danh mục', 'CATEGORY_TYPE_UPDATE', 'Cập nhật thông tin loại danh mục', true, 'UPDATE', '${RESOURCES.CATEGORY_TYPE}'),
            ('Quản lý loại danh mục', 'CATEGORY_TYPE_DELETE', 'Xóa loại danh mục', true, 'DELETE', '${RESOURCES.CATEGORY_TYPE}'),
            ('Quản lý bài viết', 'ARTICLE_READ', 'Xem danh sách bài viết', true, 'READ', '${RESOURCES.ARTICLE}'),
            ('Quản lý bài viết', 'ARTICLE_CREATE', 'Tạo bài viết mới', true, 'CREATE', '${RESOURCES.ARTICLE}'),
            ('Quản lý bài viết', 'ARTICLE_UPDATE', 'Cập nhật thông tin bài viết', true, 'UPDATE', '${RESOURCES.ARTICLE}'),
            ('Quản lý bài viết', 'ARTICLE_DELETE', 'Xóa bài viết', true, 'DELETE', '${RESOURCES.ARTICLE}'),
            ('Quản lý bài viết', 'ARTICLE_PUBLISH', 'Xuất bản bài viết', true, 'PUBLISH', '${RESOURCES.ARTICLE}'),
            ('Quản lý bài viết', 'ARTICLE_IMPORT', 'Nhập bài viết', true, 'IMPORT', '${RESOURCES.ARTICLE}'),
            ('Quản lý bài viết', 'ARTICLE_EXPORT', 'Xuất bài viết', true, 'EXPORT', '${RESOURCES.ARTICLE}'),
            ('Quản lý ebook', 'EBOOK_READ', 'Xem danh sách ebook', true, 'READ', '${RESOURCES.EBOOK}'),
            ('Quản lý ebook', 'EBOOK_CREATE', 'Tạo ebook mới', true, 'CREATE', '${RESOURCES.EBOOK}'),
            ('Quản lý ebook', 'EBOOK_UPDATE', 'Cập nhật thông tin ebook', true, 'UPDATE', '${RESOURCES.EBOOK}'),
            ('Quản lý ebook', 'EBOOK_DELETE', 'Xóa ebook', true, 'DELETE', '${RESOURCES.EBOOK}'),
            ('Quản lý ebook', 'EBOOK_IMPORT', 'Nhập ebook', true, 'IMPORT', '${RESOURCES.EBOOK}'),
            ('Quản lý ebook', 'EBOOK_EXPORT', 'Xuất ebook', true, 'EXPORT', '${RESOURCES.EBOOK}')
        `);
        // select permission by resource
        const permissionResult = await queryRunner.query(`
            SELECT id, resource FROM permission WHERE resource = '${RESOURCES.USER}' || resource = '${RESOURCES.ROLE}' || resource = '${RESOURCES.PERMISSION}' 
            || resource = '${RESOURCES.FEATURE}' || resource = '${RESOURCES.CATEGORY}' || resource = '${RESOURCES.CATEGORY_TYPE}' || resource = '${RESOURCES.ARTICLE}'
            || resource = '${RESOURCES.EBOOK}'
        `);
        
        // insert role permission
        for (const permission of permissionResult) {
            await queryRunner.query(`
                INSERT INTO role_permissions (roleId, permissionId) VALUES
                ('${superAdminRoleId}', '${permission.id}')
            `);
        }
        
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DELETE FROM role_features');
        await queryRunner.query('DELETE FROM feature');
        await queryRunner.query('DELETE FROM category');
        await queryRunner.query('DELETE FROM category_type');
        await queryRunner.query('DELETE FROM role');
    }
} 
// sql query to create user and flush privileges
// CREATE USER 'admin'@'localhost' IDENTIFIED BY 'password';
// GRANT ALL PRIVILEGES ON database_name.* TO 'username'@'host' IDENTIFIED BY 'password';
// FLUSH PRIVILEGES;