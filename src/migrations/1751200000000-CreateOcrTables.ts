import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tạo 3 bảng cho module OCR: ocr_job, ocr_result, ocr_asset.
 * Dùng CREATE TABLE IF NOT EXISTS để idempotent (an toàn khi chạy lại trên DB
 * đã có bảng), tránh xung đột với `migrationsRun: true`.
 */
export class CreateOcrTables1751200000000 implements MigrationInterface {
  name = 'CreateOcrTables1751200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`ocr_job\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`user_id\` INT NOT NULL,
        \`file_url\` TEXT NOT NULL,
        \`file_key\` VARCHAR(512) NULL,
        \`original_name\` VARCHAR(512) NULL,
        \`mime_type\` VARCHAR(128) NULL,
        \`file_size\` BIGINT NOT NULL DEFAULT 0,
        \`lang\` VARCHAR(16) NOT NULL DEFAULT 'auto',
        \`mode\` VARCHAR(16) NOT NULL DEFAULT 'layout',
        \`extract_images\` TINYINT NOT NULL DEFAULT 1,
        \`status\` VARCHAR(16) NOT NULL DEFAULT 'queued',
        \`total_pages\` INT NULL,
        \`processed_pages\` INT NOT NULL DEFAULT 0,
        \`error\` TEXT NULL,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_ocr_job_user_id\` (\`user_id\`),
        INDEX \`IDX_ocr_job_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`ocr_result\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`job_id\` INT NOT NULL,
        \`page_number\` INT NOT NULL,
        \`width\` INT NOT NULL DEFAULT 0,
        \`height\` INT NOT NULL DEFAULT 0,
        \`text\` LONGTEXT NULL,
        \`blocks\` JSON NULL,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`UQ_ocr_result_job_page\` (\`job_id\`, \`page_number\`),
        INDEX \`IDX_ocr_result_job_id\` (\`job_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`ocr_asset\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`job_id\` INT NOT NULL,
        \`page_number\` INT NOT NULL,
        \`type\` VARCHAR(16) NOT NULL DEFAULT 'image',
        \`bbox\` JSON NULL,
        \`image_url\` TEXT NULL,
        \`image_key\` VARCHAR(512) NULL,
        \`table_html\` LONGTEXT NULL,
        \`source\` VARCHAR(16) NOT NULL DEFAULT 'layout',
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_ocr_asset_job_id\` (\`job_id\`),
        INDEX \`IDX_ocr_asset_page\` (\`page_number\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`ocr_asset\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`ocr_result\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`ocr_job\``);
  }
}
