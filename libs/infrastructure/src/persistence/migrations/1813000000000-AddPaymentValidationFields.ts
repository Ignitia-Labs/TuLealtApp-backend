import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

/**
 * Migración para agregar campos de validación de pagos
 * Esta migración agrega:
 * - Nuevos estados: 'pending_validation', 'validated', 'rejected'
 * - Campos de validación: validatedBy, validatedAt, rejectedBy, rejectedAt, rejectionReason
 * - Campo isPartialPayment para tracking de pagos parciales
 * - Índice único para reference (donde reference IS NOT NULL)
 * - Migra datos existentes: 'paid' → 'validated'
 */
export class AddPaymentValidationFields1813000000000 implements MigrationInterface {
  name = 'AddPaymentValidationFields1813000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🚀 Iniciando migración de campos de validación de pagos...');

    // 1. Modificar columna status para incluir nuevos estados
    console.log('📝 Modificando columna status para incluir nuevos estados...');
    await queryRunner.query(`
      ALTER TABLE payments 
      MODIFY COLUMN status VARCHAR(20) DEFAULT 'pending_validation'
    `);

    // 2. Agregar campo isPartialPayment
    const table = await queryRunner.getTable('payments');
    const hasIsPartialPayment = table?.findColumnByName('isPartialPayment');
    
    if (!hasIsPartialPayment) {
      console.log('📝 Agregando campo isPartialPayment...');
      await queryRunner.addColumn(
        'payments',
        new TableColumn({
          name: 'isPartialPayment',
          type: 'boolean',
          default: false,
          isNullable: false,
          comment: 'Indica si este es un pago parcial',
        }),
      );
    }

    // 3. Agregar campo validatedBy
    const hasValidatedBy = table?.findColumnByName('validatedBy');
    if (!hasValidatedBy) {
      console.log('📝 Agregando campo validatedBy...');
      await queryRunner.addColumn(
        'payments',
        new TableColumn({
          name: 'validatedBy',
          type: 'int',
          isNullable: true,
          comment: 'ID del usuario que validó el pago',
        }),
      );
    }

    // 4. Agregar campo validatedAt
    const hasValidatedAt = table?.findColumnByName('validatedAt');
    if (!hasValidatedAt) {
      console.log('📝 Agregando campo validatedAt...');
      await queryRunner.addColumn(
        'payments',
        new TableColumn({
          name: 'validatedAt',
          type: 'datetime',
          isNullable: true,
          comment: 'Fecha de validación del pago',
        }),
      );
    }

    // 5. Agregar campo rejectedBy
    const hasRejectedBy = table?.findColumnByName('rejectedBy');
    if (!hasRejectedBy) {
      console.log('📝 Agregando campo rejectedBy...');
      await queryRunner.addColumn(
        'payments',
        new TableColumn({
          name: 'rejectedBy',
          type: 'int',
          isNullable: true,
          comment: 'ID del usuario que rechazó el pago',
        }),
      );
    }

    // 6. Agregar campo rejectedAt
    const hasRejectedAt = table?.findColumnByName('rejectedAt');
    if (!hasRejectedAt) {
      console.log('📝 Agregando campo rejectedAt...');
      await queryRunner.addColumn(
        'payments',
        new TableColumn({
          name: 'rejectedAt',
          type: 'datetime',
          isNullable: true,
          comment: 'Fecha de rechazo del pago',
        }),
      );
    }

    // 7. Agregar campo rejectionReason
    const hasRejectionReason = table?.findColumnByName('rejectionReason');
    if (!hasRejectionReason) {
      console.log('📝 Agregando campo rejectionReason...');
      await queryRunner.addColumn(
        'payments',
        new TableColumn({
          name: 'rejectionReason',
          type: 'text',
          isNullable: true,
          comment: 'Razón del rechazo del pago',
        }),
      );
    }

    // 8. Crear índice para validatedAt
    const hasValidatedAtIndex = table?.indices.find((idx) =>
      idx.columnNames.includes('validatedAt'),
    );
    if (!hasValidatedAtIndex) {
      console.log('📝 Creando índice para validatedAt...');
      await queryRunner.createIndex(
        'payments',
        new TableIndex({
          name: 'idx_payments_validatedAt',
          columnNames: ['validatedAt'],
        }),
      );
    }

    // 9. Crear índice único para reference (solo cuando no es NULL)
    // Nota: MySQL soporta índices únicos con WHERE clause usando índices funcionales
    const hasReferenceIndex = table?.indices.find((idx) => idx.name === 'idx_payments_reference_unique');
    if (!hasReferenceIndex) {
      console.log('📝 Creando índice único para reference...');
      // En MySQL, necesitamos un approach diferente ya que no soporta WHERE clause directo
      // Usaremos un índice normal que permita múltiples NULL pero únicos no-NULL
      await queryRunner.query(`
        CREATE UNIQUE INDEX idx_payments_reference_unique 
        ON payments (reference)
      `);
    }

    // 10. Migrar datos existentes: 'paid' → 'validated'
    console.log('🔄 Migrando pagos existentes con status "paid" a "validated"...');
    const result = await queryRunner.query(`
      UPDATE payments 
      SET 
        status = 'validated',
        validatedAt = COALESCE(processedDate, updatedAt)
      WHERE status = 'paid'
    `);
    console.log(`✅ ${result.affectedRows || 0} pagos migrados de 'paid' a 'validated'`);

    console.log('✅ Migración de campos de validación de pagos completada');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Revirtiendo migración de campos de validación de pagos...');

    // 1. Migrar datos: 'validated' → 'paid'
    console.log('🔄 Revirtiendo migración de datos...');
    await queryRunner.query(`
      UPDATE payments 
      SET status = 'paid'
      WHERE status = 'validated'
    `);

    // 2. Eliminar índice único de reference
    const table = await queryRunner.getTable('payments');
    const hasReferenceIndex = table?.indices.find((idx) => idx.name === 'idx_payments_reference_unique');
    if (hasReferenceIndex) {
      await queryRunner.dropIndex('payments', 'idx_payments_reference_unique');
    }

    // 3. Eliminar índice de validatedAt
    const hasValidatedAtIndex = table?.indices.find((idx) =>
      idx.columnNames.includes('validatedAt'),
    );
    if (hasValidatedAtIndex) {
      await queryRunner.dropIndex('payments', 'idx_payments_validatedAt');
    }

    // 4. Eliminar columnas
    await queryRunner.dropColumn('payments', 'rejectionReason');
    await queryRunner.dropColumn('payments', 'rejectedAt');
    await queryRunner.dropColumn('payments', 'rejectedBy');
    await queryRunner.dropColumn('payments', 'validatedAt');
    await queryRunner.dropColumn('payments', 'validatedBy');
    await queryRunner.dropColumn('payments', 'isPartialPayment');

    // 5. Revertir columna status
    await queryRunner.query(`
      ALTER TABLE payments 
      MODIFY COLUMN status VARCHAR(20) DEFAULT 'pending'
    `);

    console.log('✅ Migración revertida');
  }
}
