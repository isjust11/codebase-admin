import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuthorFeature1710669600009 implements MigrationInterface {
    name = 'AddAuthorFeature1710669600009'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Thêm feature cho Author Management
        await queryRunner.query(`
            INSERT INTO feature (icon, label, link, parentId, isActive, sortOrder, iconType, iconSize, className, featureTypeId, createdAt, updatedAt) 
            VALUES 
            ('ic_author', 'Tác giả', '/manager/authors', NULL, 1, 2, 'SVG', 20, '', 
             (SELECT id FROM category WHERE code = 'MANAGER' LIMIT 1), 
             NOW(), NOW())
        `);

        // Thêm sub-features cho Author
        const authorFeatureId = await queryRunner.query(`
            SELECT id FROM feature WHERE label = 'Tác giả' LIMIT 1
        `);

        if (authorFeatureId && authorFeatureId[0]) {
            const parentId = authorFeatureId[0].id;
            
            await queryRunner.query(`
                INSERT INTO feature (icon, label, link, parentId, isActive, sortOrder, iconType, iconSize, className, featureTypeId, createdAt, updatedAt) 
                VALUES 
                ('ic_list', 'Danh sách tác giả', '/manager/authors', ${parentId}, 1, 1, 'SVG', 16, '', 
                 (SELECT id FROM category WHERE code = 'MANAGER' LIMIT 1), 
                 NOW(), NOW()),
                ('ic_plus', 'Thêm tác giả', '/manager/authors/create', ${parentId}, 1, 2, 'SVG', 16, '', 
                 (SELECT id FROM category WHERE code = 'MANAGER' LIMIT 1), 
                 NOW(), NOW())
            `);
        }

        // Thêm permissions cho Author
        await queryRunner.query(`
            INSERT INTO permission (action, resource, featureId, createdAt, updatedAt) 
            VALUES 
            ('CREATE', 'author', (SELECT id FROM feature WHERE label = 'Tác giả' LIMIT 1), NOW(), NOW()),
            ('READ', 'author', (SELECT id FROM feature WHERE label = 'Tác giả' LIMIT 1), NOW(), NOW()),
            ('UPDATE', 'author', (SELECT id FROM feature WHERE label = 'Tác giả' LIMIT 1), NOW(), NOW()),
            ('DELETE', 'author', (SELECT id FROM feature WHERE label = 'Tác giả' LIMIT 1), NOW(), NOW())
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Xóa permissions
        await queryRunner.query(`
            DELETE FROM permission WHERE resource = 'author'
        `);

        // Xóa sub-features
        await queryRunner.query(`
            DELETE FROM feature WHERE parentId = (SELECT id FROM feature WHERE label = 'Tác giả' LIMIT 1)
        `);

        // Xóa feature chính
        await queryRunner.query(`
            DELETE FROM feature WHERE label = 'Tác giả'
        `);
    }
} 