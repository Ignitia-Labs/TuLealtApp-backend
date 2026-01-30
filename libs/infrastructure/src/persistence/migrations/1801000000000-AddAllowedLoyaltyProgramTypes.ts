import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex, TableUnique } from 'typeorm';

/**
 * Migración para crear tabla relacional de tipos de loyalty programs permitidos
 * Reemplaza el uso de campos JSON según la arquitectura del proyecto
 */
export class AddAllowedLoyaltyProgramTypes1801000000000 implements MigrationInterface {
  name = 'AddAllowedLoyaltyProgramTypes1801000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // CREAR TABLA RELACIONAL
    // ============================================
    const tableExists = await queryRunner.hasTable('partner_allowed_loyalty_program_types');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'partner_allowed_loyalty_program_types',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'partnerId',
              type: 'int',
              isNullable: true,
            },
            {
              name: 'partnerRequestId',
              type: 'int',
              isNullable: true,
            },
            {
              name: 'programType',
              type: 'varchar',
              length: '20',
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

      // Crear índices
      await queryRunner.createIndex(
        'partner_allowed_loyalty_program_types',
        new TableIndex({
          name: 'IDX_PARTNER_ALLOWED_TYPES_PARTNER_ID',
          columnNames: ['partnerId'],
        }),
      );

      await queryRunner.createIndex(
        'partner_allowed_loyalty_program_types',
        new TableIndex({
          name: 'IDX_PARTNER_ALLOWED_TYPES_PARTNER_REQUEST_ID',
          columnNames: ['partnerRequestId'],
        }),
      );

      await queryRunner.createIndex(
        'partner_allowed_loyalty_program_types',
        new TableIndex({
          name: 'IDX_PARTNER_ALLOWED_TYPES_TYPE',
          columnNames: ['programType'],
        }),
      );

      // Constraints UNIQUE se manejan a nivel de aplicación
      // TypeORM no soporta bien UNIQUE parciales con NULL, así que se validan en los handlers

      // Crear foreign keys
      await queryRunner.createForeignKey(
        'partner_allowed_loyalty_program_types',
        new TableForeignKey({
          columnNames: ['partnerId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'partners',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'partner_allowed_loyalty_program_types',
        new TableForeignKey({
          columnNames: ['partnerRequestId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'partner_requests',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );

      // Migrar datos existentes: establecer BASE por defecto para todos los partners
      const partners = await queryRunner.query(`SELECT id FROM partners`);
      for (const partner of partners) {
        await queryRunner.query(
          `INSERT INTO partner_allowed_loyalty_program_types (partnerId, programType, createdAt, updatedAt) VALUES (?, 'BASE', NOW(), NOW())`,
          [partner.id],
        );
      }

      // Migrar datos existentes: establecer BASE por defecto para todos los partner_requests
      const partnerRequests = await queryRunner.query(`SELECT id FROM partner_requests`);
      for (const request of partnerRequests) {
        await queryRunner.query(
          `INSERT INTO partner_allowed_loyalty_program_types (partnerRequestId, programType, createdAt, updatedAt) VALUES (?, 'BASE', NOW(), NOW())`,
          [request.id],
        );
      }

      console.log('✅ Table partner_allowed_loyalty_program_types created and data migrated.');
    } else {
      console.log('Table partner_allowed_loyalty_program_types already exists. Skipping.');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('partner_allowed_loyalty_program_types');
    if (tableExists) {
      // Eliminar foreign keys primero
      const table = await queryRunner.getTable('partner_allowed_loyalty_program_types');
      if (table) {
        const foreignKeys = table.foreignKeys;
        for (const fk of foreignKeys) {
          await queryRunner.dropForeignKey('partner_allowed_loyalty_program_types', fk);
        }
      }

      await queryRunner.dropTable('partner_allowed_loyalty_program_types');
      console.log('✅ Table partner_allowed_loyalty_program_types dropped.');
    } else {
      console.warn('Table partner_allowed_loyalty_program_types does not exist. Skipping rollback.');
    }
  }
}
