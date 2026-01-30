import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migración para agregar campos de conteo de loyalty programs a partner_subscription_usage
 * Estos campos registran el uso actual de loyalty programs por tipo
 */
export class AddLoyaltyProgramsCountToSubscriptionUsage1805000000000 implements MigrationInterface {
  name = 'AddLoyaltyProgramsCountToSubscriptionUsage1805000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Iniciando migración: Agregar campos de conteo de loyalty programs a partner_subscription_usage');

    const table = await queryRunner.getTable('partner_subscription_usage');
    if (!table) {
      console.warn('⚠️  La tabla partner_subscription_usage no existe. Saltando migración.');
      return;
    }

    // Agregar columna loyaltyProgramsCount
    const hasLoyaltyProgramsCount = table.findColumnByName('loyaltyProgramsCount');
    if (!hasLoyaltyProgramsCount) {
      await queryRunner.addColumn(
        'partner_subscription_usage',
        new TableColumn({
          name: 'loyaltyProgramsCount',
          type: 'int',
          default: 0,
          comment: 'Número total actual de loyalty programs',
        }),
      );
      console.log('✅ Columna loyaltyProgramsCount agregada.');
    } else {
      console.log('ℹ️  Columna loyaltyProgramsCount ya existe. Saltando.');
    }

    // Agregar columna loyaltyProgramsBaseCount
    const hasLoyaltyProgramsBaseCount = table.findColumnByName('loyaltyProgramsBaseCount');
    if (!hasLoyaltyProgramsBaseCount) {
      await queryRunner.addColumn(
        'partner_subscription_usage',
        new TableColumn({
          name: 'loyaltyProgramsBaseCount',
          type: 'int',
          default: 0,
          comment: 'Número actual de loyalty programs tipo BASE',
        }),
      );
      console.log('✅ Columna loyaltyProgramsBaseCount agregada.');
    } else {
      console.log('ℹ️  Columna loyaltyProgramsBaseCount ya existe. Saltando.');
    }

    // Agregar columna loyaltyProgramsPromoCount
    const hasLoyaltyProgramsPromoCount = table.findColumnByName('loyaltyProgramsPromoCount');
    if (!hasLoyaltyProgramsPromoCount) {
      await queryRunner.addColumn(
        'partner_subscription_usage',
        new TableColumn({
          name: 'loyaltyProgramsPromoCount',
          type: 'int',
          default: 0,
          comment: 'Número actual de loyalty programs tipo PROMO',
        }),
      );
      console.log('✅ Columna loyaltyProgramsPromoCount agregada.');
    } else {
      console.log('ℹ️  Columna loyaltyProgramsPromoCount ya existe. Saltando.');
    }

    // Agregar columna loyaltyProgramsPartnerCount
    const hasLoyaltyProgramsPartnerCount = table.findColumnByName('loyaltyProgramsPartnerCount');
    if (!hasLoyaltyProgramsPartnerCount) {
      await queryRunner.addColumn(
        'partner_subscription_usage',
        new TableColumn({
          name: 'loyaltyProgramsPartnerCount',
          type: 'int',
          default: 0,
          comment: 'Número actual de loyalty programs tipo PARTNER',
        }),
      );
      console.log('✅ Columna loyaltyProgramsPartnerCount agregada.');
    } else {
      console.log('ℹ️  Columna loyaltyProgramsPartnerCount ya existe. Saltando.');
    }

    // Agregar columna loyaltyProgramsSubscriptionCount
    const hasLoyaltyProgramsSubscriptionCount = table.findColumnByName('loyaltyProgramsSubscriptionCount');
    if (!hasLoyaltyProgramsSubscriptionCount) {
      await queryRunner.addColumn(
        'partner_subscription_usage',
        new TableColumn({
          name: 'loyaltyProgramsSubscriptionCount',
          type: 'int',
          default: 0,
          comment: 'Número actual de loyalty programs tipo SUBSCRIPTION',
        }),
      );
      console.log('✅ Columna loyaltyProgramsSubscriptionCount agregada.');
    } else {
      console.log('ℹ️  Columna loyaltyProgramsSubscriptionCount ya existe. Saltando.');
    }

    // Agregar columna loyaltyProgramsExperimentalCount
    const hasLoyaltyProgramsExperimentalCount = table.findColumnByName('loyaltyProgramsExperimentalCount');
    if (!hasLoyaltyProgramsExperimentalCount) {
      await queryRunner.addColumn(
        'partner_subscription_usage',
        new TableColumn({
          name: 'loyaltyProgramsExperimentalCount',
          type: 'int',
          default: 0,
          comment: 'Número actual de loyalty programs tipo EXPERIMENTAL',
        }),
      );
      console.log('✅ Columna loyaltyProgramsExperimentalCount agregada.');
    } else {
      console.log('ℹ️  Columna loyaltyProgramsExperimentalCount ya existe. Saltando.');
    }

    // Inicializar valores existentes en 0 (ya están en default: 0, pero por seguridad)
    await queryRunner.query(`
      UPDATE partner_subscription_usage
      SET
        loyaltyProgramsCount = COALESCE(loyaltyProgramsCount, 0),
        loyaltyProgramsBaseCount = COALESCE(loyaltyProgramsBaseCount, 0),
        loyaltyProgramsPromoCount = COALESCE(loyaltyProgramsPromoCount, 0),
        loyaltyProgramsPartnerCount = COALESCE(loyaltyProgramsPartnerCount, 0),
        loyaltyProgramsSubscriptionCount = COALESCE(loyaltyProgramsSubscriptionCount, 0),
        loyaltyProgramsExperimentalCount = COALESCE(loyaltyProgramsExperimentalCount, 0)
      WHERE loyaltyProgramsCount IS NULL
         OR loyaltyProgramsBaseCount IS NULL
         OR loyaltyProgramsPromoCount IS NULL
         OR loyaltyProgramsPartnerCount IS NULL
         OR loyaltyProgramsSubscriptionCount IS NULL
         OR loyaltyProgramsExperimentalCount IS NULL
    `);

    console.log('✅ Migración completada: Campos de conteo de loyalty programs agregados a partner_subscription_usage');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Iniciando rollback: Eliminar campos de conteo de loyalty programs de partner_subscription_usage');

    const table = await queryRunner.getTable('partner_subscription_usage');
    if (!table) {
      console.warn('⚠️  La tabla partner_subscription_usage no existe. Saltando rollback.');
      return;
    }

    // Eliminar columnas en orden inverso
    const columnsToRemove = [
      'loyaltyProgramsExperimentalCount',
      'loyaltyProgramsSubscriptionCount',
      'loyaltyProgramsPartnerCount',
      'loyaltyProgramsPromoCount',
      'loyaltyProgramsBaseCount',
      'loyaltyProgramsCount',
    ];

    for (const columnName of columnsToRemove) {
      const column = table.findColumnByName(columnName);
      if (column) {
        await queryRunner.dropColumn('partner_subscription_usage', columnName);
        console.log(`✅ Columna ${columnName} eliminada.`);
      } else {
        console.log(`ℹ️  Columna ${columnName} no existe. Saltando.`);
      }
    }

    console.log('✅ Rollback completado: Campos de conteo de loyalty programs eliminados de partner_subscription_usage');
  }
}
