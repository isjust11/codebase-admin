import { RoleEnum } from 'src/enums/role.enum';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { CategoryTypeEnum } from 'src/enums/category-type.enum';
import { CategoryCodeEnum } from 'src/enums/category-code.enum';
import { v4 as uuidv4 } from 'uuid';
import { RESOURCES } from 'src/constants/permission.constants';

export class SeedsCommonData1710669600002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Insert roles
        await queryRunner.query(`
            INSERT INTO role ( name, code, description, isActive) VALUES
            ('Quản trị viên', '${RoleEnum.ADMIN}', 'Quản trị viên hệ thống', true),
            ('Quản lý', '${RoleEnum.MANAGER}', 'Quản lý nhà hàng', true),
            ('Nhân viên', '${RoleEnum.STAFF}', 'Nhân viên phục vụ', true),
            ('Đầu bếp', '${RoleEnum.CHEF}', 'Đầu bếp', true),
            ('Khách hàng', '${RoleEnum.CUSTOMER}', 'Khách hàng', true),
            ('Khách', '${RoleEnum.GUEST}', 'Khách không đăng nhập', true)
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
        const adminRoleResult = await queryRunner.query(`
            SELECT id FROM role WHERE code = '${RoleEnum.ADMIN}'
        `);
        const adminRoleId = adminRoleResult[0].id;

        // Gán quyền cho role admin
        await queryRunner.query(`
            INSERT INTO role_features (roleId, featureId) VALUES
            ('${adminRoleId}', '${featureAdminId}'),
            ('${adminRoleId}', '${roleId}'),
            ('${adminRoleId}', '${featureId}'),
            ('${adminRoleId}', '${permissionId}'),
            ('${adminRoleId}', '${featureCatId}'),
            ('${adminRoleId}', '${categoryId}'),
            ('${adminRoleId}', '${categoryTypeId}')
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
            ('Quản lý món ăn', 'FOOD_ITEM_READ', 'Xem danh sách món ăn', true, 'READ', '${RESOURCES.FOOD_ITEM}'),
            ('Quản lý món ăn', 'FOOD_ITEM_CREATE', 'Tạo món ăn mới', true, 'CREATE', '${RESOURCES.FOOD_ITEM}'),
            ('Quản lý món ăn', 'FOOD_ITEM_UPDATE', 'Cập nhật thông tin món ăn', true, 'UPDATE', '${RESOURCES.FOOD_ITEM}'),
            ('Quản lý món ăn', 'FOOD_ITEM_DELETE', 'Xóa món ăn', true, 'DELETE', '${RESOURCES.FOOD_ITEM}'),
            ('Quản lý đơn hàng', 'ORDER_CREATE', 'Tạo đơn hàng mới', true, 'CREATE', '${RESOURCES.ORDER}'),
            ('Quản lý đơn hàng', 'ORDER_UPDATE', 'Cập nhật thông tin đơn hàng', true, 'UPDATE', '${RESOURCES.ORDER}'),
            ('Quản lý đơn hàng', 'ORDER_DELETE', 'Xóa đơn hàng', true, 'DELETE', '${RESOURCES.ORDER}'),
            ('Quản lý đơn hàng', 'ORDER_EXPORT', 'Xuất đơn hàng', true, 'EXPORT', '${RESOURCES.ORDER}'),
            ('Quản lý đơn hàng', 'ORDER_IMPORT', 'Nhập đơn hàng', true, 'IMPORT', '${RESOURCES.ORDER}'),
            ('Quản lý bài viết', 'ARTICLE_READ', 'Xem danh sách bài viết', true, 'READ', '${RESOURCES.ARTICLE}'),
            ('Quản lý bài viết', 'ARTICLE_CREATE', 'Tạo bài viết mới', true, 'CREATE', '${RESOURCES.ARTICLE}'),
            ('Quản lý bài viết', 'ARTICLE_UPDATE', 'Cập nhật thông tin bài viết', true, 'UPDATE', '${RESOURCES.ARTICLE}'),
            ('Quản lý bài viết', 'ARTICLE_DELETE', 'Xóa bài viết', true, 'DELETE', '${RESOURCES.ARTICLE}'),
            ('Quản lý bài viết', 'ARTICLE_PUBLISH', 'Xuất bản bài viết', true, 'PUBLISH', '${RESOURCES.ARTICLE}'),
            ('Quản lý bài viết', 'ARTICLE_IMPORT', 'Nhập bài viết', true, 'IMPORT', '${RESOURCES.ARTICLE}'),
            ('Quản lý bài viết', 'ARTICLE_EXPORT', 'Xuất bài viết', true, 'EXPORT', '${RESOURCES.ARTICLE}'),
            ('Quản lý tác giả', 'AUTHOR_READ', 'Xem danh sách tác giả', true, 'READ', '${RESOURCES.AUTHOR}'),
            ('Quản lý tác giả', 'AUTHOR_CREATE', 'Tạo tác giả mới', true, 'CREATE', '${RESOURCES.AUTHOR}'),
            ('Quản lý tác giả', 'AUTHOR_UPDATE', 'Cập nhật thông tin tác giả', true, 'UPDATE', '${RESOURCES.AUTHOR}'),
            ('Quản lý tác giả', 'AUTHOR_DELETE', 'Xóa tác giả', true, 'DELETE', '${RESOURCES.AUTHOR}'),
            ('Quản lý thuốc dân tộc', 'FOLK_MEDICINE_READ', 'Xem danh sách thuốc dân tộc', true, 'READ', '${RESOURCES.FOLK_MEDICINE}'),
            ('Quản lý thuốc dân tộc', 'FOLK_MEDICINE_CREATE', 'Tạo thuốc dân tộc mới', true, 'CREATE', '${RESOURCES.FOLK_MEDICINE}'),
            ('Quản lý thuốc dân tộc', 'FOLK_MEDICINE_UPDATE', 'Cập nhật thông tin thuốc dân tộc', true, 'UPDATE', '${RESOURCES.FOLK_MEDICINE}'),
            ('Quản lý thuốc dân tộc', 'FOLK_MEDICINE_DELETE', 'Xóa thuốc dân tộc', true, 'DELETE', '${RESOURCES.FOLK_MEDICINE}'),
            ('Quản lý thuốc thảo dược', 'HERBAL_READ', 'Xem danh sách thuốc thảo dược', true, 'READ', '${RESOURCES.HERBAL}'),
            ('Quản lý thuốc thảo dược', 'HERBAL_CREATE', 'Tạo thuốc thảo dược mới', true, 'CREATE', '${RESOURCES.HERBAL}'),
            ('Quản lý thuốc thảo dược', 'HERBAL_UPDATE', 'Cập nhật thông tin thuốc thảo dược', true, 'UPDATE', '${RESOURCES.HERBAL}'),
            ('Quản lý thuốc thảo dược', 'HERBAL_DELETE', 'Xóa thuốc thảo dược', true, 'DELETE', '${RESOURCES.HERBAL}')
        `);
        // select permission by resource
        const permissionResult = await queryRunner.query(`
            SELECT id, resource FROM permission WHERE resource = '${RESOURCES.USER}' || resource = '${RESOURCES.ROLE}' || resource = '${RESOURCES.PERMISSION}' 
            || resource = '${RESOURCES.FEATURE}' || resource = '${RESOURCES.CATEGORY}' || resource = '${RESOURCES.CATEGORY_TYPE}' || resource = '${RESOURCES.FOOD_ITEM}'
            || resource = '${RESOURCES.ORDER}' || resource = '${RESOURCES.ARTICLE}' || resource = '${RESOURCES.AUTHOR}' || resource = '${RESOURCES.FOLK_MEDICINE}' || resource = '${RESOURCES.HERBAL}'
        `);
        
        // insert role permission
        for (const permission of permissionResult) {
            await queryRunner.query(`
                INSERT INTO role_permissions (roleId, permissionId) VALUES
                ('${adminRoleId}', '${permission.id}')
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