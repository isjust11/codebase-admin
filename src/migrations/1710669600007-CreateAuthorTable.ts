import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAuthorTable1710669600007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'author',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'alias',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'biography',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'career',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'achievements',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'contributions',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'works',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'philosophy',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'legacy',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'birthDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'deathDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'birthPlace',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'deathPlace',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'era',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'dynasty',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'specialty',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'teacher',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'students',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'portrait',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'quotes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'anecdotes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'honors',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'memorials',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'references',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'viewCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'likeCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('author');
  }
} 