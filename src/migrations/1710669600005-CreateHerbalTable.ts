import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateHerbalTable1710669600005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'herbal',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'title',
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
            name: 'summary',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'scientificName',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'commonNames',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'family',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'partsUsed',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'activeCompounds',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'medicinalProperties',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'preparationMethods',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'dosage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'contraindications',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'sideEffects',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'thumbnail',
            type: 'varchar',
            length: '255',
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
            name: 'authorId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'categoryId',
            type: 'varchar',
            isNullable: true,
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
        foreignKeys: [
          {
            columnNames: ['categoryId'],
            referencedTableName: 'category',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('herbal');
  }
} 