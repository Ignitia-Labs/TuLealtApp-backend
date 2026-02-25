import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddBlockedToInvitationCodes1815000000000 implements MigrationInterface {
  name = 'AddBlockedToInvitationCodes1815000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('invitation_codes');
    const hasBlocked = table?.findColumnByName('blocked');

    if (!hasBlocked) {
      await queryRunner.addColumn(
        'invitation_codes',
        new TableColumn({
          name: 'blocked',
          type: 'boolean',
          default: false,
          isNullable: false,
          comment: 'When true, the invitation code cannot be used until unblocked',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('invitation_codes');
    const hasBlocked = table?.findColumnByName('blocked');

    if (hasBlocked) {
      await queryRunner.dropColumn('invitation_codes', 'blocked');
    }
  }
}
