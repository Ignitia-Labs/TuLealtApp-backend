import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para actualizar el comentario de la columna points en customer_memberships
 * Indica que points es una proyección calculada desde points_transactions ledger
 */
export class UpdateCustomerMembershipsPointsComment1769663627000 implements MigrationInterface {
  name = 'UpdateCustomerMembershipsPointsComment1769663627000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const table = await queryRunner.getTable('customer_memberships');
    if (!table) {
      return; // La tabla no existe, no hacer nada
    }

    // Actualizar el comentario de la columna points
    await queryRunner.query(`
      ALTER TABLE customer_memberships
      MODIFY COLUMN points INT DEFAULT 0
      COMMENT 'Proyección calculada desde points_transactions ledger. NO actualizar directamente. Usar PointsTransaction para cambios de puntos. Este campo se mantiene para performance y compatibilidad con queries existentes, pero la fuente de verdad es el ledger.'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir el comentario al original
    await queryRunner.query(`
      ALTER TABLE customer_memberships
      MODIFY COLUMN points INT DEFAULT 0
      COMMENT 'Puntos específicos de este tenant'
    `);
  }
}
