import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

/**
 * Migración para crear la tabla redemption_codes (códigos de canje)
 * Esta tabla almacena los códigos únicos generados cuando un cliente canjea una recompensa
 */
export class CreateRedemptionCodesTable1770100000000 implements MigrationInterface {
  name = 'CreateRedemptionCodesTable1770100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla ya existe (idempotente)
    const redemptionCodesTable = await queryRunner.getTable('redemption_codes');
    if (redemptionCodesTable) {
      console.log('Table redemption_codes already exists. Skipping creation.');
      return;
    }

    // Crear tabla redemption_codes
    await queryRunner.createTable(
      new Table({
        name: 'redemption_codes',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'transactionId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'rewardId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'membershipId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'tenantId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'expiresAt',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'usedAt',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'usedBy',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Crear foreign keys
    await queryRunner.createForeignKey(
      'redemption_codes',
      new TableForeignKey({
        columnNames: ['transactionId'],
        referencedTableName: 'points_transactions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_redemption_codes_transactionId',
      }),
    );

    await queryRunner.createForeignKey(
      'redemption_codes',
      new TableForeignKey({
        columnNames: ['rewardId'],
        referencedTableName: 'rewards',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_redemption_codes_rewardId',
      }),
    );

    await queryRunner.createForeignKey(
      'redemption_codes',
      new TableForeignKey({
        columnNames: ['membershipId'],
        referencedTableName: 'customer_memberships',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_redemption_codes_membershipId',
      }),
    );

    await queryRunner.createForeignKey(
      'redemption_codes',
      new TableForeignKey({
        columnNames: ['tenantId'],
        referencedTableName: 'tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_redemption_codes_tenantId',
      }),
    );

    await queryRunner.createForeignKey(
      'redemption_codes',
      new TableForeignKey({
        columnNames: ['usedBy'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'FK_redemption_codes_usedBy',
      }),
    );

    // Crear índices
    await queryRunner.createIndex(
      'redemption_codes',
      new TableIndex({
        name: 'IDX_redemption_codes_code',
        columnNames: ['code'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'redemption_codes',
      new TableIndex({
        name: 'IDX_redemption_codes_transaction_id',
        columnNames: ['transactionId'],
      }),
    );

    await queryRunner.createIndex(
      'redemption_codes',
      new TableIndex({
        name: 'IDX_redemption_codes_membership_id',
        columnNames: ['membershipId'],
      }),
    );

    await queryRunner.createIndex(
      'redemption_codes',
      new TableIndex({
        name: 'IDX_redemption_codes_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'redemption_codes',
      new TableIndex({
        name: 'IDX_redemption_codes_tenant_id',
        columnNames: ['tenantId'],
      }),
    );

    console.log('✅ Tabla redemption_codes creada exitosamente');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices primero
    const redemptionCodesTable = await queryRunner.getTable('redemption_codes');
    if (redemptionCodesTable) {
      // Eliminar foreign keys
      const foreignKeys = redemptionCodesTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('redemption_codes', fk);
      }

      // Eliminar la tabla
      await queryRunner.dropTable('redemption_codes', true);
      console.log('✅ Tabla redemption_codes eliminada exitosamente');
    }
  }
}
