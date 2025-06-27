import { RoleEnum } from 'src/enums/role.enum';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { CategoryTypeEnum } from 'src/enums/category-type.enum';
import { CategoryCodeEnum } from 'src/enums/category-code.enum';
import { v4 as uuidv4 } from 'uuid';

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
            INSERT INTO category_type (id, name, code, description, isActive) VALUES
            ('${uuidv4()}', 'Menu chức năng', '${CategoryTypeEnum.FEATURE_TYPE}', 'Danh mục các chức năng trong hệ thống', true),
            ('${uuidv4()}', 'Danh mục món ăn', '${CategoryTypeEnum.FOOD_CATEGORY}', 'Danh mục phân loại món ăn', true),
            ('${uuidv4()}', 'Loại món ăn', '${CategoryTypeEnum.FOOD_TYPE}', 'Phân loại món ăn theo loại', true),
            ('${uuidv4()}', 'Trạng thái món ăn', '${CategoryTypeEnum.FOOD_STATUS}', 'Trạng thái của món ăn', true),
            ('${uuidv4()}', 'Đơn vị món ăn', '${CategoryTypeEnum.FOOD_UNIT}', 'Đơn vị tính của món ăn', true),
            ('${uuidv4()}', 'Loại bàn', '${CategoryTypeEnum.TABLE_TYPE}', 'Phân loại bàn', true),
            ('${uuidv4()}', 'Trạng thái bàn', '${CategoryTypeEnum.TABLE_STATUS}', 'Trạng thái của bàn', true),
            ('${uuidv4()}', 'Khu vực bàn', '${CategoryTypeEnum.TABLE_AREA}', 'Khu vực đặt bàn', true)
        `);

        // Lấy category type ID cho FEATURE_TYPE
        const featureTypeResult = await queryRunner.query(`
            SELECT id FROM category_type WHERE code = '${CategoryTypeEnum.FEATURE_TYPE}'
        `);
        const featureTypeId = featureTypeResult[0].id;

        // Insert categories cho FEATURE_TYPE
        await queryRunner.query(`
            INSERT INTO category (id, name, code, description, categoryTypeId,sortOrder , isActive) VALUES
            ('${uuidv4()}', 'Menu', '${CategoryCodeEnum.FEATURE_MENU}', 'Menu chức năng chính', '${featureTypeId}',1, true),
            ('${uuidv4()}', 'Khác', '${CategoryCodeEnum.FEATURE_OTHERS}', 'Các chức năng khác', '${featureTypeId}',2,true)
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
            ( 'Vai trò', '/manager/admin/roles', '${featureAdminId}', true)
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
            ( 'Loại danh mục', '/manager/category-types', '${featureCatId}', true)
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
            ('${adminRoleId}', '${featureCatId}'),
            ('${adminRoleId}', '${categoryId}'),
            ('${adminRoleId}', '${categoryTypeId}')
        `);
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