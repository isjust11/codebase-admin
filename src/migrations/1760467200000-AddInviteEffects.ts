import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInviteEffects1760467200000 implements MigrationInterface {
  name = 'AddInviteEffects1760467200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`invite_effects\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`slug\` varchar(255) NOT NULL,
        \`themeKey\` varchar(255) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`description\` text NULL,
        \`kind\` varchar(32) NOT NULL DEFAULT 'ambient',
        \`defaultEnabled\` tinyint NOT NULL DEFAULT 1,
        \`options\` json NULL,
        \`isActive\` tinyint NOT NULL DEFAULT 1,
        \`sortOrder\` int NOT NULL DEFAULT 0,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE INDEX \`IDX_invite_effects_slug\` (\`slug\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      INSERT INTO \`feature\` (label, link, icon, iconType, parentId, isActive, iconSize, featureTypeId, createdAt, updatedAt)
      SELECT 'Kho hiệu ứng', '/manager/effects', 'Sparkles', 'lucide', NULL, true, 20, c.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM \`category\` c
      WHERE c.code = 'FEATURE_MENU'
        AND NOT EXISTS (SELECT 1 FROM \`feature\` f WHERE f.link = '/manager/effects')
      LIMIT 1
    `);

    await queryRunner.query(`
      INSERT INTO \`role_features\` (roleId, featureId)
      SELECT r.id, f.id
      FROM \`role\` r
      JOIN \`feature\` f ON f.link = '/manager/effects'
      WHERE r.code IN ('SUPPER_ADMIN', 'ADMIN')
        AND NOT EXISTS (
          SELECT 1 FROM \`role_features\` rf WHERE rf.roleId = r.id AND rf.featureId = f.id
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE rf FROM \`role_features\` rf
      JOIN \`feature\` f ON f.id = rf.featureId
      WHERE f.link = '/manager/effects'
    `);
    await queryRunner.query(`DELETE FROM \`feature\` WHERE link = '/manager/effects'`);
    await queryRunner.query(`DROP TABLE IF EXISTS \`invite_effects\``);
  }
}
