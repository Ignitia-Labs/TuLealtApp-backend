import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateCommunicationTables1770600000000 implements MigrationInterface {
  name = 'CreateCommunicationTables1770600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla message_templates
    await queryRunner.createTable(
      new Table({
        name: 'message_templates',
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
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'subject',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'body',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'variables',
            type: 'json',
            isNullable: false,
          },
          {
            name: 'usageCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'createdBy',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Crear índices para message_templates
    await queryRunner.createIndex(
      'message_templates',
      new TableIndex({
        name: 'idx_message_templates_type',
        columnNames: ['type'],
      }),
    );

    await queryRunner.createIndex(
      'message_templates',
      new TableIndex({
        name: 'idx_message_templates_active',
        columnNames: ['isActive'],
      }),
    );

    // Crear foreign key para message_templates
    await queryRunner.createForeignKey(
      'message_templates',
      new TableForeignKey({
        columnNames: ['createdBy'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );

    // Crear tabla partner_messages
    await queryRunner.createTable(
      new Table({
        name: 'partner_messages',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'subject',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'body',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'channel',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'recipientType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'totalRecipients',
            type: 'int',
            default: 0,
          },
          {
            name: 'senderId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'templateId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'scheduledAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'sentAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'draft'",
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'tags',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'attachments',
            type: 'json',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Crear índices para partner_messages
    await queryRunner.createIndex(
      'partner_messages',
      new TableIndex({
        name: 'idx_partner_messages_sender',
        columnNames: ['senderId'],
      }),
    );

    await queryRunner.createIndex(
      'partner_messages',
      new TableIndex({
        name: 'idx_partner_messages_template',
        columnNames: ['templateId'],
      }),
    );

    await queryRunner.createIndex(
      'partner_messages',
      new TableIndex({
        name: 'idx_partner_messages_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'partner_messages',
      new TableIndex({
        name: 'idx_partner_messages_type',
        columnNames: ['type'],
      }),
    );

    await queryRunner.createIndex(
      'partner_messages',
      new TableIndex({
        name: 'idx_partner_messages_channel',
        columnNames: ['channel'],
      }),
    );

    await queryRunner.createIndex(
      'partner_messages',
      new TableIndex({
        name: 'idx_partner_messages_created',
        columnNames: ['createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'partner_messages',
      new TableIndex({
        name: 'idx_partner_messages_scheduled',
        columnNames: ['scheduledAt'],
        where: 'scheduledAt IS NOT NULL',
      }),
    );

    // Crear foreign keys para partner_messages
    await queryRunner.createForeignKey(
      'partner_messages',
      new TableForeignKey({
        columnNames: ['senderId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'partner_messages',
      new TableForeignKey({
        columnNames: ['templateId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'message_templates',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );

    // Crear tabla message_recipients
    await queryRunner.createTable(
      new Table({
        name: 'message_recipients',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'messageId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'partnerId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'sent'",
          },
          {
            name: 'sentAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'deliveredAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'readAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'failureReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Crear índice único para message_recipients
    await queryRunner.createIndex(
      'message_recipients',
      new TableIndex({
        name: 'idx_message_recipients_unique',
        columnNames: ['messageId', 'partnerId'],
        isUnique: true,
      }),
    );

    // Crear índices para message_recipients
    await queryRunner.createIndex(
      'message_recipients',
      new TableIndex({
        name: 'idx_message_recipients_message',
        columnNames: ['messageId'],
      }),
    );

    await queryRunner.createIndex(
      'message_recipients',
      new TableIndex({
        name: 'idx_message_recipients_partner',
        columnNames: ['partnerId'],
      }),
    );

    await queryRunner.createIndex(
      'message_recipients',
      new TableIndex({
        name: 'idx_message_recipients_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'message_recipients',
      new TableIndex({
        name: 'idx_message_recipients_read',
        columnNames: ['readAt'],
        where: 'readAt IS NOT NULL',
      }),
    );

    await queryRunner.createIndex(
      'message_recipients',
      new TableIndex({
        name: 'idx_message_recipients_partner_status',
        columnNames: ['partnerId', 'status'],
      }),
    );

    // Crear foreign keys para message_recipients
    await queryRunner.createForeignKey(
      'message_recipients',
      new TableForeignKey({
        columnNames: ['messageId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'partner_messages',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'message_recipients',
      new TableForeignKey({
        columnNames: ['partnerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'partners',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // Crear tabla message_filters
    await queryRunner.createTable(
      new Table({
        name: 'message_filters',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'messageId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'filterType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'filterValue',
            type: 'json',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Crear índices para message_filters
    await queryRunner.createIndex(
      'message_filters',
      new TableIndex({
        name: 'idx_message_filters_message',
        columnNames: ['messageId'],
      }),
    );

    // Crear foreign key para message_filters
    await queryRunner.createForeignKey(
      'message_filters',
      new TableForeignKey({
        columnNames: ['messageId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'partner_messages',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys de message_filters
    const messageFiltersTable = await queryRunner.getTable('message_filters');
    if (messageFiltersTable) {
      const foreignKeys = messageFiltersTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('message_filters', fk);
      }
    }

    // Eliminar índices de message_filters
    await queryRunner.dropIndex('message_filters', 'idx_message_filters_message');

    // Eliminar tabla message_filters
    await queryRunner.dropTable('message_filters', true);

    // Eliminar foreign keys de message_recipients
    const messageRecipientsTable = await queryRunner.getTable('message_recipients');
    if (messageRecipientsTable) {
      const foreignKeys = messageRecipientsTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('message_recipients', fk);
      }
    }

    // Eliminar índices de message_recipients
    await queryRunner.dropIndex(
      'message_recipients',
      'idx_message_recipients_partner_status',
    );
    await queryRunner.dropIndex('message_recipients', 'idx_message_recipients_read');
    await queryRunner.dropIndex('message_recipients', 'idx_message_recipients_status');
    await queryRunner.dropIndex('message_recipients', 'idx_message_recipients_partner');
    await queryRunner.dropIndex('message_recipients', 'idx_message_recipients_message');
    await queryRunner.dropIndex('message_recipients', 'idx_message_recipients_unique');

    // Eliminar tabla message_recipients
    await queryRunner.dropTable('message_recipients', true);

    // Eliminar foreign keys de partner_messages
    const partnerMessagesTable = await queryRunner.getTable('partner_messages');
    if (partnerMessagesTable) {
      const foreignKeys = partnerMessagesTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('partner_messages', fk);
      }
    }

    // Eliminar índices de partner_messages
    await queryRunner.dropIndex('partner_messages', 'idx_partner_messages_scheduled');
    await queryRunner.dropIndex('partner_messages', 'idx_partner_messages_created');
    await queryRunner.dropIndex('partner_messages', 'idx_partner_messages_channel');
    await queryRunner.dropIndex('partner_messages', 'idx_partner_messages_type');
    await queryRunner.dropIndex('partner_messages', 'idx_partner_messages_status');
    await queryRunner.dropIndex('partner_messages', 'idx_partner_messages_template');
    await queryRunner.dropIndex('partner_messages', 'idx_partner_messages_sender');

    // Eliminar tabla partner_messages
    await queryRunner.dropTable('partner_messages', true);

    // Eliminar foreign keys de message_templates
    const messageTemplatesTable = await queryRunner.getTable('message_templates');
    if (messageTemplatesTable) {
      const foreignKeys = messageTemplatesTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('message_templates', fk);
      }
    }

    // Eliminar índices de message_templates
    await queryRunner.dropIndex('message_templates', 'idx_message_templates_active');
    await queryRunner.dropIndex('message_templates', 'idx_message_templates_type');

    // Eliminar tabla message_templates
    await queryRunner.dropTable('message_templates', true);
  }
}

