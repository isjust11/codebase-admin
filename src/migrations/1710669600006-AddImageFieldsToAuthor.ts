import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImageFieldsToAuthor1710669600006 implements MigrationInterface {
  name = 'AddImageFieldsToAuthor1710669600006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "author" 
      ADD COLUMN "avatar" VARCHAR(255),
      ADD COLUMN "coverImage" VARCHAR(255),
      ADD COLUMN "galleryImages" TEXT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "author" 
      DROP COLUMN "avatar",
      DROP COLUMN "coverImage", 
      DROP COLUMN "galleryImages"
    `);
  }
}
