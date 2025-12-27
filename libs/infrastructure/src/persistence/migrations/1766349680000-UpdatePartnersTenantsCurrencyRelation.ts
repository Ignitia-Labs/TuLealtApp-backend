import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class UpdatePartnersTenantsCurrencyRelation1766349680000 implements MigrationInterface {
  name = 'UpdatePartnersTenantsCurrencyRelation1766349680000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Mapeo de currencyId antiguos (strings) a códigos ISO
    const currencyIdMapping: Record<string, string> = {
      'currency-1': 'USD',
      'currency-2': 'MXN',
      'currency-3': 'EUR',
      'currency-4': 'COP',
      'currency-5': 'ARS',
      'currency-6': 'CLP',
      'currency-7': 'PEN',
      'currency-8': 'GTQ',
      'currency-9': 'CAD',
      'currency-10': 'HNL',
      'currency-11': 'NIO',
      'currency-12': 'CRC',
      'currency-13': 'PAB',
      'currency-14': 'SVC',
      'currency-15': 'BZD',
      'currency-16': 'BRL',
      'currency-17': 'UYU',
      'currency-18': 'PYG',
      'currency-19': 'BOB',
      'currency-20': 'VES',
      'currency-21': 'GYD',
      'currency-22': 'SRD',
      'currency-23': 'DOP',
      'currency-24': 'CUP',
      'currency-25': 'HTG',
      'currency-26': 'JMD',
      'currency-27': 'TTD',
      'currency-28': 'BBD',
      'currency-29': 'BSD',
      'currency-30': 'XCD',
    };

    // Crear columna temporal para almacenar el ID numérico de la moneda (solo si no existe)
    const partnersTableCheck = await queryRunner.getTable('partners');
    if (partnersTableCheck) {
      const existingColumn = partnersTableCheck.findColumnByName('currencyId_temp');
      if (!existingColumn) {
        await queryRunner.addColumn(
          'partners',
          new TableColumn({
            name: 'currencyId_temp',
            type: 'int',
            isNullable: true,
          }),
        );
      }
    }

    const tenantsTableCheck = await queryRunner.getTable('tenants');
    if (tenantsTableCheck) {
      const existingColumn = tenantsTableCheck.findColumnByName('currencyId_temp');
      if (!existingColumn) {
        await queryRunner.addColumn(
          'tenants',
          new TableColumn({
            name: 'currencyId_temp',
            type: 'int',
            isNullable: true,
          }),
        );
      }
    }

    // Migrar datos de partners: convertir currencyId string a ID numérico
    const partners = await queryRunner.query('SELECT id, currencyId FROM partners');
    for (const partner of partners) {
      const currencyCode = currencyIdMapping[partner.currencyId];
      if (currencyCode) {
        const currency = await queryRunner.query('SELECT id FROM currencies WHERE code = ?', [
          currencyCode,
        ]);
        if (currency && currency.length > 0) {
          await queryRunner.query('UPDATE partners SET currencyId_temp = ? WHERE id = ?', [
            currency[0].id,
            partner.id,
          ]);
        }
      }
    }

    // Migrar datos de tenants: convertir currencyId string a ID numérico
    const tenants = await queryRunner.query('SELECT id, currencyId FROM tenants');
    for (const tenant of tenants) {
      const currencyCode = currencyIdMapping[tenant.currencyId];
      if (currencyCode) {
        const currency = await queryRunner.query('SELECT id FROM currencies WHERE code = ?', [
          currencyCode,
        ]);
        if (currency && currency.length > 0) {
          await queryRunner.query('UPDATE tenants SET currencyId_temp = ? WHERE id = ?', [
            currency[0].id,
            tenant.id,
          ]);
        }
      }
    }

    // Eliminar foreign keys antes de eliminar las columnas
    const partnersTableForFk = await queryRunner.getTable('partners');
    if (partnersTableForFk) {
      const existingFk = partnersTableForFk.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('currencyId') !== -1,
      );
      if (existingFk) {
        await queryRunner.dropForeignKey('partners', existingFk);
      }
    }

    const tenantsTableForFk = await queryRunner.getTable('tenants');
    if (tenantsTableForFk) {
      const existingFk = tenantsTableForFk.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('currencyId') !== -1,
      );
      if (existingFk) {
        await queryRunner.dropForeignKey('tenants', existingFk);
      }
    }

    // Eliminar la columna antigua currencyId
    await queryRunner.dropColumn('partners', 'currencyId');
    await queryRunner.dropColumn('tenants', 'currencyId');

    // Renombrar currencyId_temp a currencyId
    await queryRunner.query('ALTER TABLE partners CHANGE currencyId_temp currencyId INT NOT NULL');
    await queryRunner.query('ALTER TABLE tenants CHANGE currencyId_temp currencyId INT NOT NULL');

    // Crear foreign keys
    await queryRunner.createForeignKey(
      'partners',
      new TableForeignKey({
        columnNames: ['currencyId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'currencies',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
        name: 'FK_partners_currencyId',
      }),
    );

    await queryRunner.createForeignKey(
      'tenants',
      new TableForeignKey({
        columnNames: ['currencyId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'currencies',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
        name: 'FK_tenants_currencyId',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys
    await queryRunner.dropForeignKey('tenants', 'FK_tenants_currencyId');
    await queryRunner.dropForeignKey('partners', 'FK_partners_currencyId');

    // Mapeo inverso: códigos ISO a currencyId antiguos
    const currencyCodeMapping: Record<string, string> = {
      USD: 'currency-1',
      MXN: 'currency-2',
      EUR: 'currency-3',
      COP: 'currency-4',
      ARS: 'currency-5',
      CLP: 'currency-6',
      PEN: 'currency-7',
      GTQ: 'currency-8',
      CAD: 'currency-9',
      HNL: 'currency-10',
      NIO: 'currency-11',
      CRC: 'currency-12',
      PAB: 'currency-13',
      SVC: 'currency-14',
      BZD: 'currency-15',
      BRL: 'currency-16',
      UYU: 'currency-17',
      PYG: 'currency-18',
      BOB: 'currency-19',
      VES: 'currency-20',
      GYD: 'currency-21',
      SRD: 'currency-22',
      DOP: 'currency-23',
      CUP: 'currency-24',
      HTG: 'currency-25',
      JMD: 'currency-26',
      TTD: 'currency-27',
      BBD: 'currency-28',
      BSD: 'currency-29',
      XCD: 'currency-30',
    };

    // Crear columna temporal para almacenar el currencyId string
    await queryRunner.addColumn(
      'partners',
      new TableColumn({
        name: 'currencyId_temp',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'tenants',
      new TableColumn({
        name: 'currencyId_temp',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
    );

    // Migrar datos de partners: convertir ID numérico a currencyId string
    const partners = await queryRunner.query('SELECT id, currencyId FROM partners');
    for (const partner of partners) {
      const currency = await queryRunner.query('SELECT code FROM currencies WHERE id = ?', [
        partner.currencyId,
      ]);
      if (currency && currency.length > 0) {
        const oldCurrencyId = currencyCodeMapping[currency[0].code] || 'currency-8'; // Default GTQ
        await queryRunner.query('UPDATE partners SET currencyId_temp = ? WHERE id = ?', [
          oldCurrencyId,
          partner.id,
        ]);
      }
    }

    // Migrar datos de tenants: convertir ID numérico a currencyId string
    const tenants = await queryRunner.query('SELECT id, currencyId FROM tenants');
    for (const tenant of tenants) {
      const currency = await queryRunner.query('SELECT code FROM currencies WHERE id = ?', [
        tenant.currencyId,
      ]);
      if (currency && currency.length > 0) {
        const oldCurrencyId = currencyCodeMapping[currency[0].code] || 'currency-8'; // Default GTQ
        await queryRunner.query('UPDATE tenants SET currencyId_temp = ? WHERE id = ?', [
          oldCurrencyId,
          tenant.id,
        ]);
      }
    }

    // Eliminar la columna currencyId numérica
    await queryRunner.dropColumn('partners', 'currencyId');
    await queryRunner.dropColumn('tenants', 'currencyId');

    // Renombrar currencyId_temp a currencyId
    await queryRunner.query(
      'ALTER TABLE partners CHANGE currencyId_temp currencyId VARCHAR(50) NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE tenants CHANGE currencyId_temp currencyId VARCHAR(50) NOT NULL',
    );
  }
}
