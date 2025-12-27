import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateCurrencies1766349670000 implements MigrationInterface {
  name = 'CreateCurrencies1766349670000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla currencies ya existe
    const table = await queryRunner.getTable('currencies');
    if (table) {
      // La tabla ya existe, no hacer nada
      return;
    }

    // Crear tabla currencies
    await queryRunner.createTable(
      new Table({
        name: 'currencies',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '3',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'symbol',
            type: 'varchar',
            length: '10',
          },
          {
            name: 'symbolPosition',
            type: 'varchar',
            length: '10',
          },
          {
            name: 'decimalPlaces',
            type: 'int',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
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
    );

    // Insertar monedas iniciales
    const currencies = [
      // América del Norte
      {
        code: 'USD',
        name: 'Dólar Estadounidense',
        symbol: '$',
        symbolPosition: 'before',
        decimalPlaces: 2,
      },
      {
        code: 'MXN',
        name: 'Peso Mexicano',
        symbol: '$',
        symbolPosition: 'before',
        decimalPlaces: 2,
      },
      {
        code: 'CAD',
        name: 'Dólar Canadiense',
        symbol: '$',
        symbolPosition: 'before',
        decimalPlaces: 2,
      },
      // América Central
      {
        code: 'GTQ',
        name: 'Quetzal Guatemalteco',
        symbol: 'Q',
        symbolPosition: 'before',
        decimalPlaces: 2,
      },
      {
        code: 'HNL',
        name: 'Lempira Hondureño',
        symbol: 'L',
        symbolPosition: 'before',
        decimalPlaces: 2,
      },
      {
        code: 'NIO',
        name: 'Córdoba Nicaragüense',
        symbol: 'C$',
        symbolPosition: 'before',
        decimalPlaces: 2,
      },
      {
        code: 'CRC',
        name: 'Colón Costarricense',
        symbol: '₡',
        symbolPosition: 'before',
        decimalPlaces: 2,
      },
      {
        code: 'PAB',
        name: 'Balboa Panameño',
        symbol: 'B/.',
        symbolPosition: 'before',
        decimalPlaces: 2,
      },
      {
        code: 'SVC',
        name: 'Colón Salvadoreño',
        symbol: '₡',
        symbolPosition: 'before',
        decimalPlaces: 2,
      },
      {
        code: 'BZD',
        name: 'Dólar Beliceño',
        symbol: 'BZ$',
        symbolPosition: 'before',
        decimalPlaces: 2,
      },
      // América del Sur
      {
        code: 'COP',
        name: 'Peso Colombiano',
        symbol: '$',
        symbolPosition: 'before',
        decimalPlaces: 0,
      },
      {
        code: 'ARS',
        name: 'Peso Argentino',
        symbol: '$',
        symbolPosition: 'before',
        decimalPlaces: 2,
      },
      {
        code: 'CLP',
        name: 'Peso Chileno',
        symbol: '$',
        symbolPosition: 'before',
        decimalPlaces: 0,
      },
      {
        code: 'PEN',
        name: 'Sol Peruano',
        symbol: 'S/',
        symbolPosition: 'before',
        decimalPlaces: 2,
      },
      {
        code: 'BRL',
        name: 'Real Brasileño',
        symbol: 'R$',
        symbolPosition: 'before',
        decimalPlaces: 2,
      },
      {
        code: 'UYU',
        name: 'Peso Uruguayo',
        symbol: '$',
        symbolPosition: 'before',
        decimalPlaces: 2,
      },
      {
        code: 'PYG',
        name: 'Guaraní Paraguayo',
        symbol: '₲',
        symbolPosition: 'before',
        decimalPlaces: 0,
      },
      { code: 'BOB', name: 'Boliviano', symbol: 'Bs', symbolPosition: 'before', decimalPlaces: 2 },
      {
        code: 'VES',
        name: 'Bolívar Venezolano',
        symbol: 'Bs.',
        symbolPosition: 'before',
        decimalPlaces: 2,
      },
      {
        code: 'GYD',
        name: 'Dólar Guyanés',
        symbol: 'G$',
        symbolPosition: 'before',
        decimalPlaces: 2,
      },
      {
        code: 'SRD',
        name: 'Dólar Surinamés',
        symbol: '$',
        symbolPosition: 'before',
        decimalPlaces: 2,
      },
      // Caribe
      {
        code: 'DOP',
        name: 'Peso Dominicano',
        symbol: 'RD$',
        symbolPosition: 'before',
        decimalPlaces: 2,
      },
      { code: 'CUP', name: 'Peso Cubano', symbol: '$', symbolPosition: 'before', decimalPlaces: 2 },
      {
        code: 'HTG',
        name: 'Gourde Haitiano',
        symbol: 'G',
        symbolPosition: 'before',
        decimalPlaces: 2,
      },
      {
        code: 'JMD',
        name: 'Dólar Jamaiquino',
        symbol: 'J$',
        symbolPosition: 'before',
        decimalPlaces: 2,
      },
      {
        code: 'TTD',
        name: 'Dólar de Trinidad y Tobago',
        symbol: 'TT$',
        symbolPosition: 'before',
        decimalPlaces: 2,
      },
      {
        code: 'BBD',
        name: 'Dólar de Barbados',
        symbol: 'Bds$',
        symbolPosition: 'before',
        decimalPlaces: 2,
      },
      {
        code: 'BSD',
        name: 'Dólar Bahameño',
        symbol: 'B$',
        symbolPosition: 'before',
        decimalPlaces: 2,
      },
      {
        code: 'XCD',
        name: 'Dólar del Caribe Oriental',
        symbol: 'EC$',
        symbolPosition: 'before',
        decimalPlaces: 2,
      },
      // Otras (referencia internacional)
      { code: 'EUR', name: 'Euro', symbol: '€', symbolPosition: 'before', decimalPlaces: 2 },
    ];

    for (const currency of currencies) {
      await queryRunner.query(
        `INSERT INTO currencies (code, name, symbol, symbolPosition, decimalPlaces, status, createdAt, updatedAt)
         VALUES ('${currency.code}', '${currency.name.replace(/'/g, "''")}', '${currency.symbol.replace(/'/g, "''")}', '${currency.symbolPosition}', ${currency.decimalPlaces}, 'active', NOW(), NOW())`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar tabla
    await queryRunner.dropTable('currencies');
  }
}
