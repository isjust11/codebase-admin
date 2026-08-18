import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates all tables from entity metadata before seed migrations run.
 * TypeORM executes migrations before `synchronize`, so seed data must come after this step.
 */
export class InitialSchema1710669600001 implements MigrationInterface {
  name = 'InitialSchema1710669600001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasRoleTable = await queryRunner.hasTable('role');
    if (hasRoleTable) {
      return;
    }

    await queryRunner.connection.synchronize();
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Schema rollback is handled manually if needed.
  }
}
