import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreatePointsTransactionsTable1769663514000 implements MigrationInterface {
  name = 'CreatePointsTransactionsTable1769663514000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla ya existe
    const table = await queryRunner.getTable('points_transactions');
    if (table) {
      return; // La tabla ya existe, no hacer nada
    }

    // Crear tabla points_transactions (LEDGER inmutable)
    await queryRunner.createTable(
      new Table({
        name: 'points_transactions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: 'ID único de la transacción',
          },
          {
            name: 'tenantId',
            type: 'int',
            isNullable: false,
            comment: 'FK a tenants - ID del tenant (merchant)',
          },
          {
            name: 'customerId',
            type: 'int',
            isNullable: false,
            comment: 'FK a users - ID del customer',
          },
          {
            name: 'membershipId',
            type: 'int',
            isNullable: false,
            comment: 'FK a customer_memberships - ID de la membership',
          },
          {
            name: 'programId',
            type: 'int',
            isNullable: true,
            comment: 'FK a loyalty_programs - ID del programa de lealtad (opcional)',
          },
          {
            name: 'rewardRuleId',
            type: 'int',
            isNullable: true,
            comment: 'FK a reward_rules - ID de la regla que generó esta transacción (opcional)',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '20',
            isNullable: false,
            comment:
              'Tipo de transacción: EARNING, REDEEM, ADJUSTMENT, REVERSAL, EXPIRATION, HOLD, RELEASE',
          },
          {
            name: 'pointsDelta',
            type: 'int',
            isNullable: false,
            comment: 'Cambio en puntos: positivo para EARNING, negativo para REDEEM/EXPIRATION',
          },
          {
            name: 'idempotencyKey',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
            comment: 'Clave única para garantizar idempotencia - UNIQUE constraint crítico',
          },
          {
            name: 'sourceEventId',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'ID del evento que originó esta transacción (para trazabilidad)',
          },
          {
            name: 'correlationId',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'ID para correlacionar transacciones relacionadas',
          },
          {
            name: 'createdBy',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Usuario/sistema que creó la transacción (para auditoría)',
          },
          {
            name: 'reasonCode',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment:
              'Código de razón para auditoría (ej: "VISIT_BONUS", "PURCHASE_BASE", "ADMIN_ADJUSTMENT")',
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
            comment:
              'Metadatos adicionales en formato JSON (flexible para diferentes tipos de transacciones)',
          },
          {
            name: 'reversalOfTransactionId',
            type: 'int',
            isNullable: true,
            comment:
              'FK a points_transactions.id - ID de la transacción que se revierte (solo para REVERSAL)',
          },
          {
            name: 'expiresAt',
            type: 'datetime',
            isNullable: true,
            comment: 'Fecha de expiración de los puntos (solo para EARNING con expiración)',
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Fecha de creación de la transacción (inmutable)',
          },
        ],
      }),
      true,
    );

    // Crear índices críticos para performance
    await queryRunner.createIndex(
      'points_transactions',
      new TableIndex({
        name: 'IDX_POINTS_TRANSACTIONS_IDEMPOTENCY_KEY',
        columnNames: ['idempotencyKey'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'points_transactions',
      new TableIndex({
        name: 'IDX_POINTS_TRANSACTIONS_MEMBERSHIP_ID',
        columnNames: ['membershipId'],
      }),
    );

    await queryRunner.createIndex(
      'points_transactions',
      new TableIndex({
        name: 'IDX_POINTS_TRANSACTIONS_PROGRAM_ID',
        columnNames: ['programId'],
      }),
    );

    await queryRunner.createIndex(
      'points_transactions',
      new TableIndex({
        name: 'IDX_POINTS_TRANSACTIONS_SOURCE_EVENT_ID',
        columnNames: ['sourceEventId'],
      }),
    );

    await queryRunner.createIndex(
      'points_transactions',
      new TableIndex({
        name: 'IDX_POINTS_TRANSACTIONS_CORRELATION_ID',
        columnNames: ['correlationId'],
      }),
    );

    await queryRunner.createIndex(
      'points_transactions',
      new TableIndex({
        name: 'IDX_POINTS_TRANSACTIONS_CREATED_AT',
        columnNames: ['createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'points_transactions',
      new TableIndex({
        name: 'IDX_POINTS_TRANSACTIONS_TYPE',
        columnNames: ['type'],
      }),
    );

    await queryRunner.createIndex(
      'points_transactions',
      new TableIndex({
        name: 'IDX_POINTS_TRANSACTIONS_EXPIRES_AT',
        columnNames: ['expiresAt'],
      }),
    );

    await queryRunner.createIndex(
      'points_transactions',
      new TableIndex({
        name: 'IDX_POINTS_TRANSACTIONS_REVERSAL_OF',
        columnNames: ['reversalOfTransactionId'],
      }),
    );

    // Crear foreign keys
    const pointsTransactionsTable = await queryRunner.getTable('points_transactions');
    if (pointsTransactionsTable) {
      // FK: tenantId -> tenants.id (CASCADE delete)
      const hasTenantIdFk = pointsTransactionsTable.foreignKeys.some(
        (fk) => fk.columnNames.indexOf('tenantId') !== -1,
      );
      if (!hasTenantIdFk) {
        await queryRunner.createForeignKey(
          'points_transactions',
          new TableForeignKey({
            name: 'FK_POINTS_TRANSACTIONS_TENANT_ID',
            columnNames: ['tenantId'],
            referencedTableName: 'tenants',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        );
      }

      // FK: customerId -> users.id (CASCADE delete)
      const hasCustomerIdFk = pointsTransactionsTable.foreignKeys.some(
        (fk) => fk.columnNames.indexOf('customerId') !== -1,
      );
      if (!hasCustomerIdFk) {
        await queryRunner.createForeignKey(
          'points_transactions',
          new TableForeignKey({
            name: 'FK_POINTS_TRANSACTIONS_CUSTOMER_ID',
            columnNames: ['customerId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        );
      }

      // FK: membershipId -> customer_memberships.id (CASCADE delete)
      const hasMembershipIdFk = pointsTransactionsTable.foreignKeys.some(
        (fk) => fk.columnNames.indexOf('membershipId') !== -1,
      );
      if (!hasMembershipIdFk) {
        await queryRunner.createForeignKey(
          'points_transactions',
          new TableForeignKey({
            name: 'FK_POINTS_TRANSACTIONS_MEMBERSHIP_ID',
            columnNames: ['membershipId'],
            referencedTableName: 'customer_memberships',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        );
      }

      // FK: reversalOfTransactionId -> points_transactions.id (SET NULL)
      const hasReversalFk = pointsTransactionsTable.foreignKeys.some(
        (fk) => fk.columnNames.indexOf('reversalOfTransactionId') !== -1,
      );
      if (!hasReversalFk) {
        await queryRunner.createForeignKey(
          'points_transactions',
          new TableForeignKey({
            name: 'FK_POINTS_TRANSACTIONS_REVERSAL_OF',
            columnNames: ['reversalOfTransactionId'],
            referencedTableName: 'points_transactions',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
        );
      }

      // Nota: programId y rewardRuleId no tienen FK aún porque esas tablas se crearán en fases posteriores
      // Se pueden agregar en migraciones futuras cuando se creen loyalty_programs y reward_rules
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys primero
    const pointsTransactionsTable = await queryRunner.getTable('points_transactions');
    if (pointsTransactionsTable) {
      const foreignKeys = pointsTransactionsTable.foreignKeys || [];
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('points_transactions', fk);
      }
    }

    // Eliminar índices
    const indices = pointsTransactionsTable?.indices || [];
    for (const index of indices) {
      await queryRunner.dropIndex('points_transactions', index);
    }

    // Eliminar tabla
    await queryRunner.dropTable('points_transactions');
  }
}
