import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

/**
 * Migración para agregar columna branchId a points_transactions
 *
 * Esta migración permite registrar la sucursal específica donde ocurrió cada transacción de puntos:
 * - Eventos de EARNING (compras, visitas, etc.)
 * - Ajustes manuales (ADJUSTMENT)
 * - Redenciones de recompensas (REDEEM)
 *
 * Beneficios:
 * - Analytics detallados por sucursal
 * - Reportes de performance por ubicación
 * - Mejor trazabilidad de operaciones
 * - Queries eficientes con índices dedicados
 *
 * NOTA: La columna es nullable para:
 * - Backward compatibility con transacciones existentes
 * - Permitir transacciones sin sucursal específica
 * - Facilitar migración gradual
 */
export class AddBranchIdToPointsTransactions1809000000000 implements MigrationInterface {
  name = 'AddBranchIdToPointsTransactions1809000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('📝 [Migration] Adding branchId column to points_transactions...');

    // 1. Agregar columna branchId
    console.log('  ⏳ Adding column branchId...');
    await queryRunner.addColumn(
      'points_transactions',
      new TableColumn({
        name: 'branchId',
        type: 'int',
        isNullable: true,
        comment:
          'FK a branches - Sucursal donde ocurrió la transacción (nullable para backward compatibility)',
      }),
    );
    console.log('  ✅ Column branchId added successfully');

    // 2. Crear índice simple para filtros por branchId
    console.log('  ⏳ Creating simple index on branchId...');
    await queryRunner.createIndex(
      'points_transactions',
      new TableIndex({
        name: 'IDX_POINTS_TRANSACTIONS_BRANCH_ID',
        columnNames: ['branchId'],
      }),
    );
    console.log('  ✅ Simple index created successfully');

    // 3. Crear índice compuesto para reportes por tenant + branch + fecha
    console.log('  ⏳ Creating composite index (tenantId, branchId, createdAt)...');
    await queryRunner.createIndex(
      'points_transactions',
      new TableIndex({
        name: 'IDX_POINTS_TRANSACTIONS_TENANT_BRANCH_DATE',
        columnNames: ['tenantId', 'branchId', 'createdAt'],
      }),
    );
    console.log('  ✅ Composite index created successfully');

    // 4. Agregar foreign key a branches
    console.log('  ⏳ Creating foreign key to branches...');
    const branchesTable = await queryRunner.getTable('branches');
    if (branchesTable) {
      await queryRunner.createForeignKey(
        'points_transactions',
        new TableForeignKey({
          name: 'FK_POINTS_TRANSACTIONS_BRANCH_ID',
          columnNames: ['branchId'],
          referencedTableName: 'branches',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL', // Si se elimina una branch, no eliminar transacciones históricas
        }),
      );
      console.log('  ✅ Foreign key created successfully');
    } else {
      console.log('  ⚠️  Warning: Branches table not found. Foreign key not created.');
      console.log('     This is not critical - the column will still work without FK.');
    }

    // 5. Verificar resultado
    const table = await queryRunner.getTable('points_transactions');
    const branchIdColumn = table?.columns.find((col) => col.name === 'branchId');

    if (branchIdColumn) {
      console.log('  ✅ Verification: branchId column exists');
      console.log(`     - Type: ${branchIdColumn.type}`);
      console.log(`     - Nullable: ${branchIdColumn.isNullable}`);
      console.log(`     - Comment: ${branchIdColumn.comment}`);
    }

    const indices = table?.indices.filter(
      (idx) =>
        idx.name === 'IDX_POINTS_TRANSACTIONS_BRANCH_ID' ||
        idx.name === 'IDX_POINTS_TRANSACTIONS_TENANT_BRANCH_DATE',
    );
    console.log(`  ✅ Verification: ${indices?.length || 0} indices created`);

    console.log('✅ [Migration] Migration completed successfully!');
    console.log('   - Column branchId added to points_transactions');
    console.log('   - 2 indices created for optimal query performance');
    console.log('   - Foreign key constraint added (if branches table exists)');
    console.log('   - Existing transactions have branchId = NULL (backward compatible)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('📝 [Rollback] Reverting branchId column from points_transactions...');

    // 1. Eliminar foreign key
    console.log('  ⏳ Dropping foreign key...');
    const table = await queryRunner.getTable('points_transactions');
    if (table) {
      const branchFk = table.foreignKeys.find(
        (fk) => fk.name === 'FK_POINTS_TRANSACTIONS_BRANCH_ID',
      );
      if (branchFk) {
        await queryRunner.dropForeignKey('points_transactions', branchFk);
        console.log('  ✅ Foreign key dropped successfully');
      } else {
        console.log('  ℹ️  Foreign key not found (was not created)');
      }
    }

    // 2. Eliminar índice compuesto
    console.log('  ⏳ Dropping composite index...');
    await queryRunner.dropIndex(
      'points_transactions',
      'IDX_POINTS_TRANSACTIONS_TENANT_BRANCH_DATE',
    );
    console.log('  ✅ Composite index dropped successfully');

    // 3. Eliminar índice simple
    console.log('  ⏳ Dropping simple index...');
    await queryRunner.dropIndex('points_transactions', 'IDX_POINTS_TRANSACTIONS_BRANCH_ID');
    console.log('  ✅ Simple index dropped successfully');

    // 4. Eliminar columna
    console.log('  ⏳ Dropping branchId column...');
    await queryRunner.dropColumn('points_transactions', 'branchId');
    console.log('  ✅ Column branchId dropped successfully');

    console.log('✅ [Rollback] Rollback completed successfully!');
    console.log('   - All changes reverted');
    console.log('   - Database is in previous state');
  }
}
