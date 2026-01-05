import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración de datos: Migrar asociaciones existentes desde customer_memberships a customer_partners
 *
 * Esta migración toma los datos existentes de customer_memberships y crea las asociaciones
 * correspondientes en customer_partners, obteniendo el partnerId desde el tenant.
 *
 * IMPORTANTE: Ejecutar solo después de que la tabla customer_partners haya sido creada
 */
export class MigrateCustomerPartnersData1768300000000 implements MigrationInterface {
  name = 'MigrateCustomerPartnersData1768300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar que la tabla customer_partners existe
    const customerPartnersTable = await queryRunner.getTable('customer_partners');
    if (!customerPartnersTable) {
      throw new Error(
        'Table customer_partners does not exist. Please run CreateCustomerPartners migration first.',
      );
    }

    // Verificar que la tabla customer_memberships existe
    const customerMembershipsTable = await queryRunner.getTable('customer_memberships');
    if (!customerMembershipsTable) {
      console.log('Table customer_memberships does not exist. Skipping data migration.');
      return;
    }

    // Migrar datos desde customer_memberships a customer_partners
    // Solo migrar si no existe ya una asociación para esa combinación (userId, partnerId, tenantId)
    const insertQuery = `
      INSERT INTO customer_partners (
        userId,
        partnerId,
        tenantId,
        registrationBranchId,
        status,
        joinedDate,
        lastActivityDate,
        createdAt,
        updatedAt
      )
      SELECT
        cm.userId,
        t.partnerId,
        cm.tenantId,
        cm.registrationBranchId,
        cm.status,
        cm.joinedDate,
        cm.lastVisit AS lastActivityDate,
        cm.createdAt,
        cm.updatedAt
      FROM customer_memberships cm
      INNER JOIN tenants t ON cm.tenantId = t.id
      WHERE NOT EXISTS (
        SELECT 1
        FROM customer_partners cp
        WHERE cp.userId = cm.userId
          AND cp.partnerId = t.partnerId
          AND cp.tenantId = cm.tenantId
      )
      AND t.partnerId IS NOT NULL;
    `;

    // Obtener conteo antes de la migración
    const countBeforeResult = await queryRunner.query(
      'SELECT COUNT(*) as count FROM customer_partners',
    );
    const countBefore = parseInt(countBeforeResult[0]?.count || '0', 10);

    // Obtener conteo de registros que se van a migrar
    const toMigrateResult = await queryRunner.query(`
      SELECT COUNT(*) as count
      FROM customer_memberships cm
      INNER JOIN tenants t ON cm.tenantId = t.id
      WHERE NOT EXISTS (
        SELECT 1
        FROM customer_partners cp
        WHERE cp.userId = cm.userId
          AND cp.partnerId = t.partnerId
          AND cp.tenantId = cm.tenantId
      )
      AND t.partnerId IS NOT NULL
    `);
    const toMigrateCount = parseInt(toMigrateResult[0]?.count || '0', 10);

    console.log(`📊 Registros antes de migración: ${countBefore}`);
    console.log(`📊 Registros a migrar: ${toMigrateCount}`);

    if (toMigrateCount === 0) {
      console.log('ℹ️  No hay registros nuevos para migrar.');
      return;
    }

    // Ejecutar la migración
    await queryRunner.query(insertQuery);

    // Obtener el conteo después de la migración
    const countAfterResult = await queryRunner.query(
      'SELECT COUNT(*) as count FROM customer_partners',
    );
    const countAfter = parseInt(countAfterResult[0]?.count || '0', 10);
    const migratedCount = countAfter - countBefore;

    console.log(`✅ Successfully migrated ${migratedCount} customer-partner associations`);
    console.log(`📊 Total registros en customer_partners: ${countAfter}`);

    // Validación básica
    if (migratedCount !== toMigrateCount) {
      console.warn(
        `⚠️  ADVERTENCIA: Se esperaban migrar ${toMigrateCount} registros, pero se migraron ${migratedCount}`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Opcional: Eliminar los datos migrados
    // CUIDADO: Esto eliminará todos los registros de customer_partners
    // Solo ejecutar si realmente necesitas revertir la migración
    console.log(
      '⚠️  WARNING: This will delete all data from customer_partners table. Comment out this code if you want to keep the data.',
    );
    // await queryRunner.query('DELETE FROM customer_partners');
  }
}
