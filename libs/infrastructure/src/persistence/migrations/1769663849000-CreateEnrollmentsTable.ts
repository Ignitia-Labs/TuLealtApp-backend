import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateEnrollmentsTable1769663849000 implements MigrationInterface {
  name = 'CreateEnrollmentsTable1769663849000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla ya existe
    const table = await queryRunner.getTable('enrollments');
    if (table) {
      return; // La tabla ya existe, no hacer nada
    }

    // Crear tabla enrollments
    await queryRunner.createTable(
      new Table({
        name: 'enrollments',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: 'ID único del enrollment',
          },
          {
            name: 'membershipId',
            type: 'int',
            isNullable: false,
            comment: 'FK a customer_memberships - ID de la membership',
          },
          {
            name: 'programId',
            type: 'int',
            isNullable: false,
            comment: 'FK a loyalty_programs - ID del programa de lealtad',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'ACTIVE'",
            comment: 'Estado del enrollment: ACTIVE, PAUSED, ENDED',
          },
          {
            name: 'effectiveFrom',
            type: 'datetime',
            isNullable: false,
            comment: 'Fecha desde la cual el enrollment es efectivo',
          },
          {
            name: 'effectiveTo',
            type: 'datetime',
            isNullable: true,
            comment: 'Fecha hasta la cual el enrollment es efectivo (null = sin expiración)',
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
            comment: 'Metadatos adicionales del enrollment (campaña, fuente, etc.)',
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Fecha de creación del enrollment',
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

    // Crear índice único compuesto para UNIQUE(membershipId, programId)
    await queryRunner.createIndex(
      'enrollments',
      new TableIndex({
        name: 'UQ_ENROLLMENTS_MEMBERSHIP_PROGRAM',
        columnNames: ['membershipId', 'programId'],
        isUnique: true,
      }),
    );

    // Crear índices
    await queryRunner.createIndex(
      'enrollments',
      new TableIndex({
        name: 'IDX_ENROLLMENTS_MEMBERSHIP_ID',
        columnNames: ['membershipId'],
      }),
    );

    await queryRunner.createIndex(
      'enrollments',
      new TableIndex({
        name: 'IDX_ENROLLMENTS_PROGRAM_ID',
        columnNames: ['programId'],
      }),
    );

    await queryRunner.createIndex(
      'enrollments',
      new TableIndex({
        name: 'IDX_ENROLLMENTS_STATUS',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'enrollments',
      new TableIndex({
        name: 'IDX_ENROLLMENTS_EFFECTIVE_FROM',
        columnNames: ['effectiveFrom'],
      }),
    );

    await queryRunner.createIndex(
      'enrollments',
      new TableIndex({
        name: 'IDX_ENROLLMENTS_EFFECTIVE_TO',
        columnNames: ['effectiveTo'],
      }),
    );

    // Crear foreign keys
    const enrollmentsTable = await queryRunner.getTable('enrollments');
    if (enrollmentsTable) {
      // FK: membershipId -> customer_memberships.id (CASCADE delete)
      const hasMembershipIdFk = enrollmentsTable.foreignKeys.some(
        (fk) => fk.columnNames.indexOf('membershipId') !== -1,
      );
      if (!hasMembershipIdFk) {
        await queryRunner.createForeignKey(
          'enrollments',
          new TableForeignKey({
            name: 'FK_ENROLLMENTS_MEMBERSHIP_ID',
            columnNames: ['membershipId'],
            referencedTableName: 'customer_memberships',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        );
      }

      // FK: programId -> loyalty_programs.id (CASCADE delete)
      const hasProgramIdFk = enrollmentsTable.foreignKeys.some(
        (fk) => fk.columnNames.indexOf('programId') !== -1,
      );
      if (!hasProgramIdFk) {
        await queryRunner.createForeignKey(
          'enrollments',
          new TableForeignKey({
            name: 'FK_ENROLLMENTS_PROGRAM_ID',
            columnNames: ['programId'],
            referencedTableName: 'loyalty_programs',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys primero
    const enrollmentsTable = await queryRunner.getTable('enrollments');
    if (enrollmentsTable) {
      const foreignKeys = enrollmentsTable.foreignKeys || [];
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('enrollments', fk);
      }
    }

    // Eliminar índices
    const indices = enrollmentsTable?.indices || [];
    for (const index of indices) {
      await queryRunner.dropIndex('enrollments', index);
    }

    // Eliminar tabla
    await queryRunner.dropTable('enrollments');
  }
}
