import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/**
 * Migración para eliminar la tabla customer_partners
 *
 * Esta tabla era redundante y estaba desincronizada con customer_memberships.
 * Los datos ahora se obtienen directamente desde customer_memberships con JOINs a tenants.
 *
 * IMPORTANTE: Esta migración elimina la tabla y todos sus datos.
 * Los datos pueden regenerarse desde customer_memberships si es necesario.
 */
export class RemoveCustomerPartnersTable1777300000000 implements MigrationInterface {
  name = 'RemoveCustomerPartnersTable1777300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const table = await queryRunner.getTable('customer_partners');
    if (!table) {
      console.log('Table customer_partners does not exist. Skipping migration.');
      return;
    }

    // Obtener conteo antes de eliminar (para logging)
    const countResult = await queryRunner.query(
      'SELECT COUNT(*) as count FROM customer_partners',
    );
    const count = parseInt(countResult[0]?.count || '0', 10);
    console.log(`📊 Total registros en customer_partners antes de eliminar: ${count}`);

    if (count > 0) {
      console.log(
        `⚠️  ADVERTENCIA: Se eliminarán ${count} registros de customer_partners. ` +
          `Los datos pueden regenerarse desde customer_memberships si es necesario.`,
      );
    }

    // Eliminar la tabla (esto eliminará automáticamente índices y foreign keys)
    await queryRunner.dropTable('customer_partners', true);

    console.log('✅ Tabla customer_partners eliminada exitosamente');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla ya existe
    const table = await queryRunner.getTable('customer_partners');
    if (table) {
      console.log('Table customer_partners already exists. Skipping rollback.');
      return;
    }

    // Recrear la tabla customer_partners
    // Nota: Esta es una recreación básica. Si necesitas restaurar datos,
    // deberás ejecutar la migración MigrateCustomerPartnersData después.
    await queryRunner.createTable(
      new Table({
        name: 'customer_partners',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'userId',
            type: 'int',
            isNullable: false,
            comment: 'FK a users - ID del usuario (customer)',
          },
          {
            name: 'partnerId',
            type: 'int',
            isNullable: false,
            comment: 'FK a partners - ID del partner',
          },
          {
            name: 'tenantId',
            type: 'int',
            isNullable: false,
            comment: 'FK a tenants - ID del tenant específico del partner',
          },
          {
            name: 'registrationBranchId',
            type: 'int',
            isNullable: true,
            comment: 'FK a branches - Branch donde se registró el customer',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
            comment: 'Estado de la asociación: active, inactive o suspended',
          },
          {
            name: 'joinedDate',
            type: 'datetime',
            isNullable: false,
            comment: 'Fecha de asociación del customer con el partner',
          },
          {
            name: 'lastActivityDate',
            type: 'datetime',
            isNullable: true,
            comment: 'Fecha de última actividad del customer con el partner',
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
            comment: 'Metadatos adicionales en formato JSON',
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

    // Recrear índices básicos
    await queryRunner.query(`
      CREATE INDEX IDX_customer_partners_userId ON customer_partners(userId)
    `);
    await queryRunner.query(`
      CREATE INDEX IDX_customer_partners_partnerId ON customer_partners(partnerId)
    `);
    await queryRunner.query(`
      CREATE INDEX IDX_customer_partners_tenantId ON customer_partners(tenantId)
    `);
    await queryRunner.query(`
      CREATE INDEX IDX_customer_partners_status ON customer_partners(status)
    `);
    await queryRunner.query(`
      CREATE INDEX IDX_customer_partners_joinedDate ON customer_partners(joinedDate)
    `);
    await queryRunner.query(`
      CREATE INDEX IDX_customer_partners_user_partner ON customer_partners(userId, partnerId)
    `);
    await queryRunner.query(`
      CREATE INDEX IDX_customer_partners_partner_status ON customer_partners(partnerId, status)
    `);
    await queryRunner.query(`
      CREATE INDEX IDX_customer_partners_user_status ON customer_partners(userId, status)
    `);

    // Recrear foreign keys
    await queryRunner.query(`
      ALTER TABLE customer_partners
      ADD CONSTRAINT FK_CUSTOMER_PARTNERS_USER_ID
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE customer_partners
      ADD CONSTRAINT FK_CUSTOMER_PARTNERS_PARTNER_ID
      FOREIGN KEY (partnerId) REFERENCES partners(id) ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE customer_partners
      ADD CONSTRAINT FK_CUSTOMER_PARTNERS_TENANT_ID
      FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE customer_partners
      ADD CONSTRAINT FK_CUSTOMER_PARTNERS_REGISTRATION_BRANCH_ID
      FOREIGN KEY (registrationBranchId) REFERENCES branches(id) ON DELETE SET NULL
    `);

    console.log('✅ Tabla customer_partners recreada exitosamente');
    console.log(
      '⚠️  NOTA: Los datos no se restauran automáticamente. ' +
        'Ejecuta la migración MigrateCustomerPartnersData si necesitas restaurar datos.',
    );
  }
}

