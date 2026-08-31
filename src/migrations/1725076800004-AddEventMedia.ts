import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Creates the event_media table for the Hybrid storage strategy.
 * Scalar customization fields (names, dates, colors) remain in events.eventData (JSON).
 * Structured media assets (album photos, videos) are stored here with typed columns.
 */
export class AddEventMedia1725076800004 implements MigrationInterface {
  name = 'AddEventMedia1725076800004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('event_media');
    if (hasTable) return;

    await queryRunner.createTable(
      new Table({
        name: 'event_media',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'eventId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'groupKey',
            type: 'varchar',
            length: '100',
            isNullable: false,
            comment: 'Logical group: album, highlight_video, moments, etc.',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '16',
            default: "'image'",
            isNullable: false,
          },
          {
            name: 'url',
            type: 'varchar',
            length: '1024',
            isNullable: false,
          },
          {
            name: 'caption',
            type: 'varchar',
            length: '512',
            isNullable: true,
          },
          {
            name: 'mimeType',
            type: 'varchar',
            length: '128',
            isNullable: true,
          },
          {
            name: 'fileSize',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'width',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'height',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'sortOrder',
            type: 'int',
            default: 0,
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

    // Composite index for fast lookup by event + group
    await queryRunner.createIndex(
      'event_media',
      new TableIndex({
        name: 'IDX_event_media_eventId_groupKey',
        columnNames: ['eventId', 'groupKey'],
      }),
    );

    // FK → events.id CASCADE DELETE
    await queryRunner.createForeignKey(
      'event_media',
      new TableForeignKey({
        name: 'FK_event_media_event',
        columnNames: ['eventId'],
        referencedTableName: 'events',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('event_media');
    if (!hasTable) return;

    await queryRunner.dropTable('event_media', true, true, true);
  }
}
