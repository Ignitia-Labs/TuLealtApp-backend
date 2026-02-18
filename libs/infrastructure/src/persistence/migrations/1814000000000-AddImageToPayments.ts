import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddImageToPayments1814000000000 implements MigrationInterface {
  name = 'AddImageToPayments1814000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('payments');
    const hasImage = table?.findColumnByName('image');

    if (!hasImage) {
      await queryRunner.addColumn(
        'payments',
        new TableColumn({
          name: 'image',
          type: 'text',
          isNullable: true,
          comment: 'URL de la imagen del comprobante de pago (subida a S3)',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('payments');
    const hasImage = table?.findColumnByName('image');

    if (hasImage) {
      await queryRunner.dropColumn('payments', 'image');
    }
  }
}
