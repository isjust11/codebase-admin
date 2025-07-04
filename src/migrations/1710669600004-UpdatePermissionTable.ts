import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdatePermissionTable1710669600004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Thêm cột action
    await queryRunner.addColumn(
      'permission',
      new TableColumn({
        name: 'action',
        type: 'varchar',
        isNullable: true,
      }),
    );

    // Thêm cột resource
    await queryRunner.addColumn(
      'permission',
      new TableColumn({
        name: 'resource',
        type: 'varchar',
        isNullable: true,
      }),
    );

    // Thêm cột featureId
    await queryRunner.addColumn(
      'permission',
      new TableColumn({
        name: 'featureId',
        type: 'int',
        isNullable: true,
      }),
    );

    // Thêm foreign key constraint cho featureId
    await queryRunner.query(`
      ALTER TABLE permission 
      ADD CONSTRAINT FK_permission_feature 
      FOREIGN KEY (featureId) REFERENCES feature(id) ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Xóa foreign key constraint
    await queryRunner.query(`ALTER TABLE permission DROP CONSTRAINT FK_permission_feature`);

    // Xóa các cột đã thêm
    await queryRunner.dropColumn('permission', 'featureId');
    await queryRunner.dropColumn('permission', 'resource');
    await queryRunner.dropColumn('permission', 'action');
  }
} 