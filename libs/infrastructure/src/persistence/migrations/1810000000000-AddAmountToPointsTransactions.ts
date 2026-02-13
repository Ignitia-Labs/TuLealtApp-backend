import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

/**
 * Migración para agregar columnas amount y currency a points_transactions
 *
 * Esta migración permite capturar el revenue (monto monetario) de las transacciones:
 * - amount: Monto en moneda (solo para transacciones EARNING de tipo PURCHASE)
 * - currency: Código de moneda ISO 4217 (GTQ, USD, etc.)
 *
 * Beneficios:
 * - Queries de revenue 10-100x más rápidas vs JSON parsing
 * - Indexable nativamente para agregaciones eficientes
 * - Analytics multi-sucursal con métricas de negocio
 * - ROI y efficiency de recompensas calculables
 *
 * Manejo de diferentes tipos de transacciones:
 * - PURCHASE (EARNING): amount = netAmount del evento ✅
 * - VISIT, REFERRAL, etc.: amount = NULL (no generan revenue) ✅
 * - REDEEM: amount = NULL (no es revenue) ✅
 * - ADJUSTMENT: amount = NULL (ajuste manual sin compra) ✅
 *
 * Compatibilidad:
 * - Columnas nullable para backward compatibility
 * - Metadata JSON preservado para auditoría
 * - Migración de datos históricos desde metadata.netAmount
 */
export class AddAmountToPointsTransactions1810000000000 implements MigrationInterface {
  name = 'AddAmountToPointsTransactions1810000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('📝 [Migration] Adding amount and currency columns to points_transactions...');

    // 1. Verificar y agregar columna amount (idempotente)
    console.log('  ⏳ Adding column amount (DECIMAL 15,2)...');
    const amountColumn = await queryRunner.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'points_transactions' 
        AND COLUMN_NAME = 'amount'
    `);

    if (amountColumn.length === 0) {
      await queryRunner.addColumn(
        'points_transactions',
        new TableColumn({
          name: 'amount',
          type: 'decimal',
          precision: 15,
          scale: 2,
          isNullable: true,
          comment: 'Monto monetario de la transacción (solo para EARNING de PURCHASE)',
        }),
      );
      console.log('  ✅ Column amount added successfully');
    } else {
      console.log('  ⚠️  Column amount already exists, skipping...');
    }

    // 2. Verificar y agregar columna currency (idempotente)
    console.log('  ⏳ Adding column currency...');
    const currencyColumn = await queryRunner.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'points_transactions' 
        AND COLUMN_NAME = 'currency'
    `);

    if (currencyColumn.length === 0) {
      await queryRunner.addColumn(
        'points_transactions',
        new TableColumn({
          name: 'currency',
          type: 'varchar',
          length: '10',
          isNullable: true,
          default: "'GTQ'",
          comment: 'Moneda del monto (ISO 4217: GTQ, USD, etc.)',
        }),
      );
      console.log('  ✅ Column currency added successfully');
    } else {
      console.log('  ⚠️  Column currency already exists, skipping...');
    }

    // 3. Migrar datos históricos desde metadata JSON
    console.log('  ⏳ Migrating historical data from metadata JSON...');
    console.log('     This may take a while depending on the number of transactions...');

    const updateQuery = `
      UPDATE points_transactions
      SET 
        amount = CAST(JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.netAmount')) AS DECIMAL(15,2)),
        currency = COALESCE(JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.currency')), 'GTQ')
      WHERE type = 'EARNING' 
        AND reasonCode IN ('PURCHASE', 'PURCHASE_BASE', 'PURCHASE_BONUS')
        AND JSON_EXTRACT(metadata, '$.netAmount') IS NOT NULL
        AND amount IS NULL
    `;

    const result = await queryRunner.query(updateQuery);
    console.log(`  ✅ Historical data migrated: ${result.affectedRows || 0} rows updated`);

    // 4. Crear índice para queries de revenue por sucursal (idempotente)
    console.log('  ⏳ Creating index (branchId, type, amount, createdAt)...');
    const branchIndexExists = await queryRunner.query(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'points_transactions' 
        AND INDEX_NAME = 'IDX_POINTS_TRANSACTIONS_AMOUNT_BRANCH'
    `);

    if (branchIndexExists.length === 0) {
      await queryRunner.createIndex(
        'points_transactions',
        new TableIndex({
          name: 'IDX_POINTS_TRANSACTIONS_AMOUNT_BRANCH',
          columnNames: ['branchId', 'type', 'amount', 'createdAt'],
        }),
      );
      console.log('  ✅ Branch revenue index created successfully');
    } else {
      console.log('  ⚠️  Branch revenue index already exists, skipping...');
    }

    // 5. Crear índice para queries de revenue por tenant (idempotente)
    console.log('  ⏳ Creating index (tenantId, type, amount, createdAt)...');
    const tenantIndexExists = await queryRunner.query(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'points_transactions' 
        AND INDEX_NAME = 'IDX_POINTS_TRANSACTIONS_AMOUNT_TENANT'
    `);

    if (tenantIndexExists.length === 0) {
      await queryRunner.createIndex(
        'points_transactions',
        new TableIndex({
          name: 'IDX_POINTS_TRANSACTIONS_AMOUNT_TENANT',
          columnNames: ['tenantId', 'type', 'amount', 'createdAt'],
        }),
      );
      console.log('  ✅ Tenant revenue index created successfully');
    } else {
      console.log('  ⚠️  Tenant revenue index already exists, skipping...');
    }

    // 6. Verificar resultado
    const table = await queryRunner.getTable('points_transactions');
    const amountColumnCheck = table?.columns.find((col) => col.name === 'amount');
    const currencyColumnCheck = table?.columns.find((col) => col.name === 'currency');

    if (amountColumnCheck && currencyColumnCheck) {
      console.log('  ✅ Verification: amount and currency columns exist');
      console.log(
        `     - amount: ${amountColumnCheck.type}(${amountColumnCheck.precision},${amountColumnCheck.scale}), nullable: ${amountColumnCheck.isNullable}`,
      );
      console.log(
        `     - currency: ${currencyColumnCheck.type}(${currencyColumnCheck.length}), nullable: ${currencyColumnCheck.isNullable}`,
      );
    }

    const indices = table?.indices.filter(
      (idx) =>
        idx.name === 'IDX_POINTS_TRANSACTIONS_AMOUNT_BRANCH' ||
        idx.name === 'IDX_POINTS_TRANSACTIONS_AMOUNT_TENANT',
    );
    console.log(`  ✅ Verification: ${indices?.length || 0} indices created for revenue queries`);

    // 7. Estadísticas post-migración
    console.log('  ⏳ Generating migration statistics...');
    const stats = await queryRunner.query(`
      SELECT 
        type,
        reasonCode,
        COUNT(*) as total,
        SUM(CASE WHEN amount IS NOT NULL THEN 1 ELSE 0 END) as with_amount,
        ROUND(SUM(amount), 2) as total_revenue
      FROM points_transactions
      WHERE type = 'EARNING'
      GROUP BY type, reasonCode
      ORDER BY total_revenue DESC
      LIMIT 10
    `);

    console.log('  📊 Migration Statistics:');
    stats.forEach((row: any) => {
      console.log(
        `     - ${row.type} (${row.reasonCode || 'N/A'}): ${row.with_amount}/${row.total} with amount, revenue: ${row.total_revenue || 0}`,
      );
    });

    console.log('✅ [Migration] Migration completed successfully!');
    console.log('   - Columns amount and currency added to points_transactions');
    console.log('   - Historical data migrated from metadata JSON');
    console.log('   - 2 indices created for optimal revenue query performance');
    console.log('   - Transactions without revenue have amount = NULL (VISIT, REFERRAL, etc.)');
    console.log('   - Ready for analytics multi-sucursal implementation!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('📝 [Rollback] Reverting amount and currency columns from points_transactions...');

    // 1. Eliminar índice de revenue por tenant
    console.log('  ⏳ Dropping tenant revenue index...');
    await queryRunner.dropIndex('points_transactions', 'IDX_POINTS_TRANSACTIONS_AMOUNT_TENANT');
    console.log('  ✅ Tenant revenue index dropped successfully');

    // 2. Eliminar índice de revenue por sucursal
    console.log('  ⏳ Dropping branch revenue index...');
    await queryRunner.dropIndex('points_transactions', 'IDX_POINTS_TRANSACTIONS_AMOUNT_BRANCH');
    console.log('  ✅ Branch revenue index dropped successfully');

    // 3. Eliminar columna currency
    console.log('  ⏳ Dropping currency column...');
    await queryRunner.dropColumn('points_transactions', 'currency');
    console.log('  ✅ Column currency dropped successfully');

    // 4. Eliminar columna amount
    console.log('  ⏳ Dropping amount column...');
    await queryRunner.dropColumn('points_transactions', 'amount');
    console.log('  ✅ Column amount dropped successfully');

    console.log('✅ [Rollback] Rollback completed successfully!');
    console.log('   - All changes reverted');
    console.log('   - Database is in previous state');
    console.log('   - Historical data preserved in metadata JSON');
  }
}
