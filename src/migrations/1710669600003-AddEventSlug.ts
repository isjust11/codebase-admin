import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds public slug to events for React host GET /public/events/:slug
 */
export class AddEventSlug1710669600003 implements MigrationInterface {
  name = 'AddEventSlug1710669600003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('events');
    if (!table) return;
    const hasSlug = table.columns.some((c) => c.name === 'slug');
    if (!hasSlug) {
      await queryRunner.query(
        `ALTER TABLE \`events\` ADD \`slug\` varchar(255) NULL`,
      );
      await queryRunner.query(
        `CREATE UNIQUE INDEX \`IDX_events_slug\` ON \`events\` (\`slug\`)`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('events');
    if (!table) return;
    const hasSlug = table.columns.some((c) => c.name === 'slug');
    if (hasSlug) {
      await queryRunner.query(`DROP INDEX \`IDX_events_slug\` ON \`events\``);
      await queryRunner.query(`ALTER TABLE \`events\` DROP COLUMN \`slug\``);
    }
  }
}
