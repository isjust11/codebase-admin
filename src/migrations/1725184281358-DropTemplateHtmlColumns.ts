import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropTemplateHtmlColumns1725184281358 implements MigrationInterface {
  name = 'DropTemplateHtmlColumns1725184281358';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`templates\` DROP COLUMN \`htmlContent\`, DROP COLUMN \`cssContent\`, DROP COLUMN \`layoutJson\`, DROP COLUMN \`editorMode\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`templates\` ADD \`htmlContent\` longtext NULL`);
    await queryRunner.query(`ALTER TABLE \`templates\` ADD \`cssContent\` longtext NULL`);
    await queryRunner.query(`ALTER TABLE \`templates\` ADD \`layoutJson\` json NULL`);
    await queryRunner.query(
      `ALTER TABLE \`templates\` ADD \`editorMode\` varchar(16) NOT NULL DEFAULT 'CODE'`,
    );
  }
}
