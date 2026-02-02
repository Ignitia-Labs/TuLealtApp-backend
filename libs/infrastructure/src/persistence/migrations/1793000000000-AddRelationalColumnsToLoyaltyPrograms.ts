import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

/**
 * Migración: Agregar columnas relacionales a loyalty_programs
 *
 * Esta migración agrega nuevas columnas y tablas relacionadas para reemplazar
 * los campos JSON en loyalty_programs. Las columnas JSON se mantienen temporalmente
 * hasta que se migren los datos y se valide la integridad.
 *
 * Fase 3.1 del Plan de Eliminación de Tipos JSON
 */
export class AddRelationalColumnsToLoyaltyPrograms1793000000000 implements MigrationInterface {
  name = 'AddRelationalColumnsToLoyaltyPrograms1793000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const loyaltyProgramsTable = await queryRunner.getTable('loyalty_programs');

    if (loyaltyProgramsTable) {
      // ============================================================================
      // 1. AGREGAR COLUMNAS PARA stacking (JSON → Columnas directas)
      // ============================================================================
      const hasStackingAllowed = loyaltyProgramsTable.findColumnByName('stacking_allowed');
      if (!hasStackingAllowed) {
        await queryRunner.addColumn(
          'loyalty_programs',
          new TableColumn({
            name: 'stacking_allowed',
            type: 'boolean',
            isNullable: false,
            default: false,
            comment: 'Permite stacking de programas (extraído de stacking JSON)',
          }),
        );

        await queryRunner.addColumn(
          'loyalty_programs',
          new TableColumn({
            name: 'stacking_max_programs_per_event',
            type: 'int',
            isNullable: true,
            comment: 'Máximo de programas por evento (extraído de stacking JSON)',
          }),
        );

        await queryRunner.addColumn(
          'loyalty_programs',
          new TableColumn({
            name: 'stacking_max_programs_per_period',
            type: 'int',
            isNullable: true,
            comment: 'Máximo de programas por período (extraído de stacking JSON)',
          }),
        );

        await queryRunner.addColumn(
          'loyalty_programs',
          new TableColumn({
            name: 'stacking_period',
            type: 'enum',
            enum: ['daily', 'weekly', 'monthly'],
            isNullable: true,
            comment: 'Período para stacking (extraído de stacking JSON)',
          }),
        );

        await queryRunner.addColumn(
          'loyalty_programs',
          new TableColumn({
            name: 'stacking_selection_strategy',
            type: 'enum',
            enum: ['BEST_VALUE', 'PRIORITY_RANK', 'FIRST_MATCH'],
            isNullable: true,
            comment: 'Estrategia de selección para stacking (extraído de stacking JSON)',
          }),
        );
      }

      // ============================================================================
      // 2. AGREGAR COLUMNAS PARA limits (JSON → Columnas directas)
      // ============================================================================
      const hasLimitMaxPointsPerEvent = loyaltyProgramsTable.findColumnByName(
        'limit_max_points_per_event',
      );
      if (!hasLimitMaxPointsPerEvent) {
        await queryRunner.addColumn(
          'loyalty_programs',
          new TableColumn({
            name: 'limit_max_points_per_event',
            type: 'int',
            isNullable: true,
            comment: 'Máximo de puntos por evento (extraído de limits JSON)',
          }),
        );

        await queryRunner.addColumn(
          'loyalty_programs',
          new TableColumn({
            name: 'limit_max_points_per_day',
            type: 'int',
            isNullable: true,
            comment: 'Máximo de puntos por día (extraído de limits JSON)',
          }),
        );

        await queryRunner.addColumn(
          'loyalty_programs',
          new TableColumn({
            name: 'limit_max_points_per_month',
            type: 'int',
            isNullable: true,
            comment: 'Máximo de puntos por mes (extraído de limits JSON)',
          }),
        );

        await queryRunner.addColumn(
          'loyalty_programs',
          new TableColumn({
            name: 'limit_max_points_per_year',
            type: 'int',
            isNullable: true,
            comment: 'Máximo de puntos por año (extraído de limits JSON)',
          }),
        );
      }

      // ============================================================================
      // 3. AGREGAR COLUMNAS PARA expirationPolicy (JSON → Columnas directas)
      // ============================================================================
      const hasExpirationEnabled = loyaltyProgramsTable.findColumnByName('expiration_enabled');
      if (!hasExpirationEnabled) {
        await queryRunner.addColumn(
          'loyalty_programs',
          new TableColumn({
            name: 'expiration_enabled',
            type: 'boolean',
            isNullable: false,
            default: false,
            comment: 'Habilita expiración de puntos (extraído de expirationPolicy JSON)',
          }),
        );

        await queryRunner.addColumn(
          'loyalty_programs',
          new TableColumn({
            name: 'expiration_type',
            type: 'enum',
            enum: ['simple', 'bucketed'],
            isNullable: true,
            comment: 'Tipo de expiración (extraído de expirationPolicy JSON)',
          }),
        );

        await queryRunner.addColumn(
          'loyalty_programs',
          new TableColumn({
            name: 'expiration_days_to_expire',
            type: 'int',
            isNullable: true,
            comment: 'Días hasta expiración (extraído de expirationPolicy JSON)',
          }),
        );

        await queryRunner.addColumn(
          'loyalty_programs',
          new TableColumn({
            name: 'expiration_grace_period_days',
            type: 'int',
            isNullable: true,
            comment: 'Días de período de gracia (extraído de expirationPolicy JSON)',
          }),
        );
      }
    }

    // ============================================================================
    // 4. CREAR TABLA loyalty_program_earning_domains
    // ============================================================================
    const earningDomainsTableExists = await queryRunner.hasTable('loyalty_program_earning_domains');
    if (!earningDomainsTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'loyalty_program_earning_domains',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
              comment: 'ID único del dominio de earning',
            },
            {
              name: 'program_id',
              type: 'int',
              isNullable: false,
              comment: 'FK a loyalty_programs',
            },
            {
              name: 'domain',
              type: 'varchar',
              length: '50',
              isNullable: false,
              comment: 'Dominio de earning (debe ser del catálogo central)',
            },
          ],
        }),
        true,
      );

      // Crear foreign key
      await queryRunner.createForeignKey(
        'loyalty_program_earning_domains',
        new TableForeignKey({
          name: 'FK_LOYALTY_PROGRAM_EARNING_DOMAINS_PROGRAM_ID',
          columnNames: ['program_id'],
          referencedTableName: 'loyalty_programs',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      // Crear índices
      await queryRunner.createIndex(
        'loyalty_program_earning_domains',
        new TableIndex({
          name: 'IDX_LOYALTY_PROGRAM_EARNING_DOMAINS_PROGRAM_ID',
          columnNames: ['program_id'],
        }),
      );

      await queryRunner.createIndex(
        'loyalty_program_earning_domains',
        new TableIndex({
          name: 'IDX_LOYALTY_PROGRAM_EARNING_DOMAINS_DOMAIN',
          columnNames: ['domain'],
        }),
      );

      // Crear unique constraint para (program_id, domain)
      await queryRunner.createIndex(
        'loyalty_program_earning_domains',
        new TableIndex({
          name: 'UK_LOYALTY_PROGRAM_EARNING_DOMAINS_PROGRAM_DOMAIN',
          columnNames: ['program_id', 'domain'],
          isUnique: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar tabla relacionada primero
    if (await queryRunner.hasTable('loyalty_program_earning_domains')) {
      await queryRunner.dropTable('loyalty_program_earning_domains');
    }

    // Eliminar columnas de loyalty_programs (en orden inverso)
    const loyaltyProgramsTable = await queryRunner.getTable('loyalty_programs');
    if (loyaltyProgramsTable) {
      // Eliminar columnas de expirationPolicy
      if (loyaltyProgramsTable.findColumnByName('expiration_grace_period_days')) {
        await queryRunner.dropColumn('loyalty_programs', 'expiration_grace_period_days');
      }
      if (loyaltyProgramsTable.findColumnByName('expiration_days_to_expire')) {
        await queryRunner.dropColumn('loyalty_programs', 'expiration_days_to_expire');
      }
      if (loyaltyProgramsTable.findColumnByName('expiration_type')) {
        await queryRunner.dropColumn('loyalty_programs', 'expiration_type');
      }
      if (loyaltyProgramsTable.findColumnByName('expiration_enabled')) {
        await queryRunner.dropColumn('loyalty_programs', 'expiration_enabled');
      }

      // Eliminar columnas de limits
      if (loyaltyProgramsTable.findColumnByName('limit_max_points_per_year')) {
        await queryRunner.dropColumn('loyalty_programs', 'limit_max_points_per_year');
      }
      if (loyaltyProgramsTable.findColumnByName('limit_max_points_per_month')) {
        await queryRunner.dropColumn('loyalty_programs', 'limit_max_points_per_month');
      }
      if (loyaltyProgramsTable.findColumnByName('limit_max_points_per_day')) {
        await queryRunner.dropColumn('loyalty_programs', 'limit_max_points_per_day');
      }
      if (loyaltyProgramsTable.findColumnByName('limit_max_points_per_event')) {
        await queryRunner.dropColumn('loyalty_programs', 'limit_max_points_per_event');
      }

      // Eliminar columnas de stacking
      if (loyaltyProgramsTable.findColumnByName('stacking_selection_strategy')) {
        await queryRunner.dropColumn('loyalty_programs', 'stacking_selection_strategy');
      }
      if (loyaltyProgramsTable.findColumnByName('stacking_period')) {
        await queryRunner.dropColumn('loyalty_programs', 'stacking_period');
      }
      if (loyaltyProgramsTable.findColumnByName('stacking_max_programs_per_period')) {
        await queryRunner.dropColumn('loyalty_programs', 'stacking_max_programs_per_period');
      }
      if (loyaltyProgramsTable.findColumnByName('stacking_max_programs_per_event')) {
        await queryRunner.dropColumn('loyalty_programs', 'stacking_max_programs_per_event');
      }
      if (loyaltyProgramsTable.findColumnByName('stacking_allowed')) {
        await queryRunner.dropColumn('loyalty_programs', 'stacking_allowed');
      }
    }
  }
}
