import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHerbalFeature1710669600008 implements MigrationInterface {
    name = 'AddHerbalFeature1710669600008'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Thêm feature cho Herbal Management
        await queryRunner.query(`
            INSERT INTO feature (icon, label, link, parentId, isActive, sortOrder, iconType, iconSize, className, featureTypeId, createdAt, updatedAt) 
            VALUES 
            ('ic_herbal', 'Thảo dược', '/manager/herbals', NULL, 1, 1, 'SVG', 20, '', 
             (SELECT id FROM category WHERE code = 'MANAGER' LIMIT 1), 
             NOW(), NOW())
        `);

        // Thêm sub-features cho Herbal
        const herbalFeatureId = await queryRunner.query(`
            SELECT id FROM feature WHERE label = 'Thảo dược' LIMIT 1
        `);

        if (herbalFeatureId && herbalFeatureId[0]) {
            const parentId = herbalFeatureId[0].id;
            
            await queryRunner.query(`
                INSERT INTO feature (icon, label, link, parentId, isActive, sortOrder, iconType, iconSize, className, featureTypeId, createdAt, updatedAt) 
                VALUES 
                ('ic_list', 'Danh sách thảo dược', '/manager/herbals', ${parentId}, 1, 1, 'SVG', 16, '', 
                 (SELECT id FROM category WHERE code = 'MANAGER' LIMIT 1), 
                 NOW(), NOW()),
                ('ic_plus', 'Thêm thảo dược', '/manager/herbals/create', ${parentId}, 1, 2, 'SVG', 16, '', 
                 (SELECT id FROM category WHERE code = 'MANAGER' LIMIT 1), 
                 NOW(), NOW())
            `);
        }

        // Thêm permissions cho Herbal
        await queryRunner.query(`
            INSERT INTO permission (action, resource, featureId, createdAt, updatedAt) 
            VALUES 
            ('CREATE', 'herbal', (SELECT id FROM feature WHERE label = 'Thảo dược' LIMIT 1), NOW(), NOW()),
            ('READ', 'herbal', (SELECT id FROM feature WHERE label = 'Thảo dược' LIMIT 1), NOW(), NOW()),
            ('UPDATE', 'herbal', (SELECT id FROM feature WHERE label = 'Thảo dược' LIMIT 1), NOW(), NOW()),
            ('DELETE', 'herbal', (SELECT id FROM feature WHERE label = 'Thảo dược' LIMIT 1), NOW(), NOW())
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Xóa permissions
        await queryRunner.query(`
            DELETE FROM permission WHERE resource = 'herbal'
        `);

        // Xóa sub-features
        await queryRunner.query(`
            DELETE FROM feature WHERE parentId = (SELECT id FROM feature WHERE label = 'Thảo dược' LIMIT 1)
        `);

        // Xóa feature chính
        await queryRunner.query(`
            DELETE FROM feature WHERE label = 'Thảo dược'
        `);
    }
} 