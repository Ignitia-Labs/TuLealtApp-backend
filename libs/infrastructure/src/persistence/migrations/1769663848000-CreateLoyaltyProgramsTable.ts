import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateLoyaltyProgramsTable1769663848000 implements MigrationInterface {
  name = 'CreateLoyaltyProgramsTable1769663848000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla ya existe
    const table = await queryRunner.getTable('loyalty_programs');
    if (table) {
      return; // La tabla ya existe, no hacer nada
    }

    // Crear tabla loyalty_programs
    await queryRunner.createTable(
      new Table({
        name: 'loyalty_programs',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: 'ID único del programa de lealtad',
          },
          {
            name: 'tenantId',
            type: 'int',
            isNullable: false,
            comment: 'FK a tenants - ID del tenant (merchant)',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'Nombre del programa de lealtad',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
            comment: 'Descripción del programa',
          },
          {
            name: 'programType',
            type: 'varchar',
            length: '20',
            isNullable: false,
            comment: 'Tipo de programa: BASE, PROMO, PARTNER, SUBSCRIPTION, EXPERIMENTAL',
          },
          {
            name: 'earningDomains',
            type: 'json',
            isNullable: false,
            comment: 'Dominios de earning del programa (ej: BASE_PURCHASE, VISIT, BONUS_CATEGORY)',
          },
          {
            name: 'priorityRank',
            type: 'int',
            default: 0,
            comment: 'Rank de prioridad (mayor = mayor prioridad)',
          },
          {
            name: 'stacking',
            type: 'json',
            isNullable: false,
            comment: 'Política de stacking: allowed, maxProgramsPerEvent, selectionStrategy, etc.',
          },
          {
            name: 'limits',
            type: 'json',
            isNullable: true,
            comment: 'Límites del programa: maxPointsPerEvent, maxPointsPerDay, etc.',
          },
          {
            name: 'expirationPolicy',
            type: 'json',
            isNullable: false,
            comment:
              'Política de expiración: enabled, type (simple/bucketed), daysToExpire, gracePeriodDays',
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '10',
            isNullable: true,
            comment: 'Código de moneda del programa (ej: USD, GTQ)',
          },
          {
            name: 'minPointsToRedeem',
            type: 'int',
            default: 0,
            comment: 'Mínimo de puntos requeridos para canjear',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'draft'",
            comment: 'Estado del programa: active, inactive, draft',
          },
          {
            name: 'version',
            type: 'int',
            default: 1,
            comment: 'Versión del programa (para inmutabilidad histórica)',
          },
          {
            name: 'activeFrom',
            type: 'datetime',
            isNullable: true,
            comment: 'Fecha desde la cual el programa está activo',
          },
          {
            name: 'activeTo',
            type: 'datetime',
            isNullable: true,
            comment: 'Fecha hasta la cual el programa está activo',
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Fecha de creación del programa',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            comment: 'Fecha de última actualización',
          },
        ],
      }),
      true,
    );

    // Crear índices
    await queryRunner.createIndex(
      'loyalty_programs',
      new TableIndex({
        name: 'IDX_LOYALTY_PROGRAMS_TENANT_ID',
        columnNames: ['tenantId'],
      }),
    );

    await queryRunner.createIndex(
      'loyalty_programs',
      new TableIndex({
        name: 'IDX_LOYALTY_PROGRAMS_TYPE',
        columnNames: ['programType'],
      }),
    );

    await queryRunner.createIndex(
      'loyalty_programs',
      new TableIndex({
        name: 'IDX_LOYALTY_PROGRAMS_STATUS',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'loyalty_programs',
      new TableIndex({
        name: 'IDX_LOYALTY_PROGRAMS_TENANT_TYPE_STATUS',
        columnNames: ['tenantId', 'programType', 'status'],
      }),
    );

    // Crear foreign keys
    const loyaltyProgramsTable = await queryRunner.getTable('loyalty_programs');
    if (loyaltyProgramsTable) {
      // FK: tenantId -> tenants.id (CASCADE delete)
      const hasTenantIdFk = loyaltyProgramsTable.foreignKeys.some(
        (fk) => fk.columnNames.indexOf('tenantId') !== -1,
      );
      if (!hasTenantIdFk) {
        await queryRunner.createForeignKey(
          'loyalty_programs',
          new TableForeignKey({
            name: 'FK_LOYALTY_PROGRAMS_TENANT_ID',
            columnNames: ['tenantId'],
            referencedTableName: 'tenants',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys primero
    const loyaltyProgramsTable = await queryRunner.getTable('loyalty_programs');
    if (loyaltyProgramsTable) {
      const foreignKeys = loyaltyProgramsTable.foreignKeys || [];
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('loyalty_programs', fk);
      }
    }

    // Eliminar índices
    const indices = loyaltyProgramsTable?.indices || [];
    for (const index of indices) {
      await queryRunner.dropIndex('loyalty_programs', index);
    }

    // Eliminar tabla
    await queryRunner.dropTable('loyalty_programs');
  }
}
