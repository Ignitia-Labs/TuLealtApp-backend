import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreatePartnerStaffAssignmentsAndCommissions1770000000000
  implements MigrationInterface
{
  name = 'CreatePartnerStaffAssignmentsAndCommissions1770000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla partner_staff_assignments
    await queryRunner.createTable(
      new Table({
        name: 'partner_staff_assignments',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'partnerId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'staffUserId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'commissionPercent',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'startDate',
            type: 'datetime',
            isNullable: false,
          },
          {
            name: 'endDate',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
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

    // Crear índices para partner_staff_assignments
    await queryRunner.createIndex(
      'partner_staff_assignments',
      new TableIndex({
        name: 'idx_partner_staff_assignments_partner',
        columnNames: ['partnerId'],
      }),
    );

    await queryRunner.createIndex(
      'partner_staff_assignments',
      new TableIndex({
        name: 'idx_partner_staff_assignments_staff',
        columnNames: ['staffUserId'],
      }),
    );

    await queryRunner.createIndex(
      'partner_staff_assignments',
      new TableIndex({
        name: 'idx_partner_staff_assignments_active',
        columnNames: ['isActive'],
      }),
    );

    await queryRunner.createIndex(
      'partner_staff_assignments',
      new TableIndex({
        name: 'idx_partner_staff_assignments_dates',
        columnNames: ['startDate', 'endDate'],
      }),
    );

    // Crear foreign keys para partner_staff_assignments
    await queryRunner.createForeignKey(
      'partner_staff_assignments',
      new TableForeignKey({
        columnNames: ['partnerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'partners',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'partner_staff_assignments',
      new TableForeignKey({
        columnNames: ['staffUserId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // Crear tabla commissions
    await queryRunner.createTable(
      new Table({
        name: 'commissions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'partnerId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'staffUserId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'paymentId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'subscriptionId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'assignmentId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'paymentAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'commissionPercent',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'commissionAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '10',
            default: "'USD'",
          },
          {
            name: 'paymentDate',
            type: 'datetime',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
          },
          {
            name: 'paidDate',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
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

    // Crear índices para commissions
    await queryRunner.createIndex(
      'commissions',
      new TableIndex({
        name: 'idx_commissions_partner',
        columnNames: ['partnerId'],
      }),
    );

    await queryRunner.createIndex(
      'commissions',
      new TableIndex({
        name: 'idx_commissions_staff',
        columnNames: ['staffUserId'],
      }),
    );

    await queryRunner.createIndex(
      'commissions',
      new TableIndex({
        name: 'idx_commissions_payment',
        columnNames: ['paymentId'],
      }),
    );

    await queryRunner.createIndex(
      'commissions',
      new TableIndex({
        name: 'idx_commissions_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'commissions',
      new TableIndex({
        name: 'idx_commissions_payment_date',
        columnNames: ['paymentDate'],
      }),
    );

    await queryRunner.createIndex(
      'commissions',
      new TableIndex({
        name: 'idx_commissions_partner_payment',
        columnNames: ['partnerId', 'paymentDate'],
      }),
    );

    await queryRunner.createIndex(
      'commissions',
      new TableIndex({
        name: 'idx_commissions_staff_status_date',
        columnNames: ['staffUserId', 'status', 'paymentDate'],
      }),
    );

    // Crear índice único para evitar comisiones duplicadas
    await queryRunner.createIndex(
      'commissions',
      new TableIndex({
        name: 'idx_commissions_unique_payment_staff',
        columnNames: ['paymentId', 'staffUserId'],
        isUnique: true,
      }),
    );

    // Crear foreign keys para commissions
    await queryRunner.createForeignKey(
      'commissions',
      new TableForeignKey({
        columnNames: ['partnerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'partners',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'commissions',
      new TableForeignKey({
        columnNames: ['staffUserId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'commissions',
      new TableForeignKey({
        columnNames: ['paymentId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'payments',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'commissions',
      new TableForeignKey({
        columnNames: ['assignmentId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'partner_staff_assignments',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys de commissions
    const commissionsTable = await queryRunner.getTable('commissions');
    if (commissionsTable) {
      const foreignKeys = commissionsTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('commissions', fk);
      }
    }

    // Eliminar índices de commissions
    await queryRunner.dropIndex(
      'commissions',
      'idx_commissions_unique_payment_staff',
    );
    await queryRunner.dropIndex(
      'commissions',
      'idx_commissions_staff_status_date',
    );
    await queryRunner.dropIndex(
      'commissions',
      'idx_commissions_partner_payment',
    );
    await queryRunner.dropIndex('commissions', 'idx_commissions_payment_date');
    await queryRunner.dropIndex('commissions', 'idx_commissions_status');
    await queryRunner.dropIndex('commissions', 'idx_commissions_payment');
    await queryRunner.dropIndex('commissions', 'idx_commissions_staff');
    await queryRunner.dropIndex('commissions', 'idx_commissions_partner');

    // Eliminar tabla commissions
    await queryRunner.dropTable('commissions', true);

    // Eliminar foreign keys de partner_staff_assignments
    const assignmentsTable = await queryRunner.getTable(
      'partner_staff_assignments',
    );
    if (assignmentsTable) {
      const foreignKeys = assignmentsTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('partner_staff_assignments', fk);
      }
    }

    // Eliminar índices de partner_staff_assignments
    await queryRunner.dropIndex(
      'partner_staff_assignments',
      'idx_partner_staff_assignments_dates',
    );
    await queryRunner.dropIndex(
      'partner_staff_assignments',
      'idx_partner_staff_assignments_active',
    );
    await queryRunner.dropIndex(
      'partner_staff_assignments',
      'idx_partner_staff_assignments_staff',
    );
    await queryRunner.dropIndex(
      'partner_staff_assignments',
      'idx_partner_staff_assignments_partner',
    );

    // Eliminar tabla partner_staff_assignments
    await queryRunner.dropTable('partner_staff_assignments', true);
  }
}

