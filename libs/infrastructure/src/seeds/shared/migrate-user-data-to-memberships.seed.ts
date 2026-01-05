import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BaseSeed } from '../base/base-seed';

/**
 * Seed para migrar datos existentes de User a customer_memberships
 *
 * Este seed migra los datos de usuarios que tienen tenantId, points, tierId, etc.
 * a la nueva tabla customer_memberships antes de eliminar esos campos de User.
 *
 * ⚠️ IMPORTANTE: Este seed debe ejecutarse ANTES de la migración RemoveCustomerFieldsFromUsers
 */
@Injectable()
export class MigrateUserDataToMembershipsSeed extends BaseSeed {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  getName(): string {
    return 'MigrateUserDataToMembershipsSeed';
  }

  async run(): Promise<void> {
    this.log('Iniciando migración de datos de User a customer_memberships...');

    try {
      // Verificar si la tabla customer_memberships existe
      const customerMembershipsTable = await this.dataSource.query(
        "SHOW TABLES LIKE 'customer_memberships'",
      );
      if (customerMembershipsTable.length === 0) {
        this.log(
          '⚠️  La tabla customer_memberships no existe. Ejecuta primero la migración CreateCustomerMemberships.',
        );
        return;
      }

      // Verificar si ya hay memberships (para evitar migración duplicada)
      const existingMemberships = await this.dataSource.query(
        'SELECT COUNT(*) as count FROM customer_memberships',
      );
      if (existingMemberships[0].count > 0) {
        this.log(
          `⚠️  Ya existen ${existingMemberships[0].count} memberships. Verificando si la migración ya se completó...`,
        );
        // Verificar si hay usuarios con tenantId que no tienen membership
        const usersWithoutMembership = await this.dataSource.query(`
          SELECT u.id, u.tenantId
          FROM users u
          LEFT JOIN customer_memberships cm ON u.id = cm.userId AND u.tenantId = cm.tenantId
          WHERE u.tenantId IS NOT NULL AND cm.id IS NULL
          LIMIT 1
        `);
        if (usersWithoutMembership.length === 0) {
          this.log('✓ Todos los usuarios con tenantId ya tienen membership. Migración completada.');
          return;
        }
      }

      // Buscar usuarios con tenantId que necesitan migración
      const usersToMigrate = await this.dataSource.query(`
        SELECT
          u.id as userId,
          u.tenantId,
          COALESCE(u.branchId, NULL) as branchId,
          COALESCE(u.points, 0) as points,
          u.tierId,
          u.qrCode,
          u.createdAt as joinedDate
        FROM users u
        WHERE u.tenantId IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM customer_memberships cm
          WHERE cm.userId = u.id AND cm.tenantId = u.tenantId
        )
      `);

      if (usersToMigrate.length === 0) {
        this.log('✓ No hay usuarios que necesiten migración.');
        return;
      }

      this.log(`Encontrados ${usersToMigrate.length} usuarios para migrar...`);

      let migratedCount = 0;
      let errorCount = 0;

      for (const user of usersToMigrate) {
        try {
          // Validar que el tenant existe
          const tenantExists = await this.dataSource.query('SELECT id FROM tenants WHERE id = ?', [
            user.tenantId,
          ]);
          if (tenantExists.length === 0) {
            this.log(`⚠️  Usuario ${user.userId}: Tenant ${user.tenantId} no existe. Saltando...`);
            errorCount++;
            continue;
          }

          // Validar que la branch existe si se proporciona
          let registrationBranchId = user.branchId;
          if (registrationBranchId) {
            const branchExists = await this.dataSource.query(
              'SELECT id FROM branches WHERE id = ? AND tenantId = ?',
              [registrationBranchId, user.tenantId],
            );
            if (branchExists.length === 0) {
              this.log(
                `⚠️  Usuario ${user.userId}: Branch ${registrationBranchId} no existe o no pertenece al tenant. Usando NULL...`,
              );
              registrationBranchId = null;
            }
          }

          // Si no hay branchId válido, buscar la primera branch del tenant
          if (!registrationBranchId) {
            const firstBranch = await this.dataSource.query(
              'SELECT id FROM branches WHERE tenantId = ? LIMIT 1',
              [user.tenantId],
            );
            if (firstBranch.length > 0) {
              registrationBranchId = firstBranch[0].id;
            }
          }

          // Si aún no hay branch, crear una branch por defecto o usar la primera disponible
          // Según el plan, registrationBranchId es required (int, no nullable)
          // Por ahora, si no hay branch, intentamos usar la primera branch del tenant
          // Si aún no hay, debemos crear una o saltar este usuario
          if (!registrationBranchId) {
            // Intentar obtener cualquier branch del tenant (por si acaso)
            const anyBranch = await this.dataSource.query(
              'SELECT id FROM branches WHERE tenantId = ? ORDER BY id ASC LIMIT 1',
              [user.tenantId],
            );
            if (anyBranch.length > 0) {
              registrationBranchId = anyBranch[0].id;
              this.log(
                `⚠️  Usuario ${user.userId}: Usando branch ${registrationBranchId} del tenant ${user.tenantId}`,
              );
            } else {
              this.log(
                `⚠️  Usuario ${user.userId}: No se encontró branch para el tenant ${user.tenantId}. Saltando...`,
              );
              errorCount++;
              continue;
            }
          }

          // Generar QR code si no existe
          let qrCode = user.qrCode;
          if (!qrCode) {
            // Generar QR code único: QR-USER-{userId}-TENANT-{tenantId}-{random}
            const random = Math.random().toString(36).substring(2, 8).toUpperCase();
            qrCode = `QR-USER-${user.userId}-TENANT-${user.tenantId}-${random}`;
          }

          // Verificar que el QR code sea único
          const qrExists = await this.dataSource.query(
            'SELECT id FROM customer_memberships WHERE qrCode = ?',
            [qrCode],
          );
          if (qrExists.length > 0) {
            // Si existe, generar uno nuevo
            const random = Math.random().toString(36).substring(2, 8).toUpperCase();
            qrCode = `QR-USER-${user.userId}-TENANT-${user.tenantId}-${random}`;
          }

          // Crear la membership usando SQL directo
          await this.dataSource.query(
            `INSERT INTO customer_memberships
            (userId, tenantId, registrationBranchId, points, tierId, totalSpent, totalVisits, lastVisit, joinedDate, qrCode, status, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, 0, 0, NULL, ?, ?, 'active', NOW(), NOW())`,
            [
              user.userId,
              user.tenantId,
              registrationBranchId,
              user.points || 0,
              user.tierId,
              user.joinedDate || new Date(),
              qrCode,
            ],
          );

          migratedCount++;
          this.log(
            `✓ Usuario ${user.userId} migrado: tenantId=${user.tenantId}, points=${user.points || 0}, branchId=${registrationBranchId}`,
          );
        } catch (error) {
          errorCount++;
          this.error(`Error al migrar usuario ${user.userId}`, error);
        }
      }

      this.log(`✓ Migración completada: ${migratedCount} usuarios migrados, ${errorCount} errores`);

      // Validar migración
      const validationQuery = await this.dataSource.query(`
        SELECT
          COUNT(DISTINCT u.id) as usersWithTenant,
          COUNT(DISTINCT cm.id) as membershipsCreated
        FROM users u
        LEFT JOIN customer_memberships cm ON u.id = cm.userId AND u.tenantId = cm.tenantId
        WHERE u.tenantId IS NOT NULL
      `);

      const usersWithTenant = validationQuery[0].usersWithTenant;
      const membershipsCreated = validationQuery[0].membershipsCreated;

      if (usersWithTenant === membershipsCreated) {
        this.log(`✓ Validación exitosa: Todos los usuarios con tenantId tienen membership`);
      } else {
        this.log(
          `⚠️  Validación: ${usersWithTenant} usuarios con tenantId, ${membershipsCreated} memberships creadas`,
        );
      }
    } catch (error) {
      this.error('Error en migración de datos', error);
      throw error;
    }
  }
}
