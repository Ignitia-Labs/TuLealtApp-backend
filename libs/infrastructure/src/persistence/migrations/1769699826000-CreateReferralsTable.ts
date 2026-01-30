import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateReferralsTable1769699826000 implements MigrationInterface {
  name = 'CreateReferralsTable1769699826000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla referrals
    const referralsTable = await queryRunner.getTable('referrals');
    if (!referralsTable) {
      await queryRunner.createTable(
        new Table({
          name: 'referrals',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'referrerMembershipId',
              type: 'int',
              isNullable: false,
              comment: 'ID del membership que refiere',
            },
            {
              name: 'referredMembershipId',
              type: 'int',
              isNullable: false,
              comment: 'ID del membership referido',
            },
            {
              name: 'tenantId',
              type: 'int',
              isNullable: false,
              comment: 'ID del tenant (para aislamiento)',
            },
            {
              name: 'status',
              type: 'varchar',
              length: '20',
              isNullable: false,
              default: "'pending'",
              comment: 'pending, active, completed, cancelled',
            },
            {
              name: 'referralCode',
              type: 'varchar',
              length: '255',
              isNullable: true,
              comment: 'Código de referido usado (opcional)',
            },
            {
              name: 'firstPurchaseCompleted',
              type: 'boolean',
              isNullable: false,
              default: false,
              comment: 'Si el referido completó su primera compra',
            },
            {
              name: 'rewardGranted',
              type: 'boolean',
              isNullable: false,
              default: false,
              comment: 'Si ya se otorgó la recompensa al referidor',
            },
            {
              name: 'rewardGrantedAt',
              type: 'datetime',
              isNullable: true,
              comment: 'Fecha en que se otorgó la recompensa',
            },
            {
              name: 'firstPurchaseCompletedAt',
              type: 'datetime',
              isNullable: true,
              comment: 'Fecha de primera compra del referido',
            },
            {
              name: 'createdAt',
              type: 'datetime',
              isNullable: false,
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updatedAt',
              type: 'datetime',
              isNullable: false,
              default: 'CURRENT_TIMESTAMP',
              onUpdate: 'CURRENT_TIMESTAMP',
            },
          ],
        }),
        true,
      );

      // Crear foreign keys
      await queryRunner.createForeignKey(
        'referrals',
        new TableForeignKey({
          columnNames: ['referrerMembershipId'],
          referencedTableName: 'customer_memberships',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          name: 'FK_REFERRALS_REFERRER_MEMBERSHIP',
        }),
      );

      await queryRunner.createForeignKey(
        'referrals',
        new TableForeignKey({
          columnNames: ['referredMembershipId'],
          referencedTableName: 'customer_memberships',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          name: 'FK_REFERRALS_REFERRED_MEMBERSHIP',
        }),
      );

      // Crear índices
      await queryRunner.createIndex(
        'referrals',
        new TableIndex({
          name: 'IDX_REFERRALS_REFERRER',
          columnNames: ['referrerMembershipId'],
        }),
      );

      await queryRunner.createIndex(
        'referrals',
        new TableIndex({
          name: 'IDX_REFERRALS_REFERRED',
          columnNames: ['referredMembershipId'],
        }),
      );

      await queryRunner.createIndex(
        'referrals',
        new TableIndex({
          name: 'IDX_REFERRALS_TENANT',
          columnNames: ['tenantId'],
        }),
      );

      await queryRunner.createIndex(
        'referrals',
        new TableIndex({
          name: 'IDX_REFERRALS_STATUS',
          columnNames: ['status'],
        }),
      );

      await queryRunner.createIndex(
        'referrals',
        new TableIndex({
          name: 'IDX_REFERRALS_CREATED_AT',
          columnNames: ['createdAt'],
        }),
      );

      // Crear índice único para evitar duplicados (MySQL requiere usar createIndex con isUnique)
      await queryRunner.createIndex(
        'referrals',
        new TableIndex({
          name: 'UQ_REFERRALS_REFERRER_REFERRED_TENANT',
          columnNames: ['referrerMembershipId', 'referredMembershipId', 'tenantId'],
          isUnique: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const referralsTable = await queryRunner.getTable('referrals');
    if (referralsTable) {
      await queryRunner.dropTable('referrals', true, true);
    }
  }
}
