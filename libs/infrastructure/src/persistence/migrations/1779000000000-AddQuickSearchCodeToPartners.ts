import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

/**
 * Migración para agregar la columna quickSearchCode a la tabla partners
 * Este código será usado para generar QR codes y permitir búsqueda rápida por los customers
 */
export class AddQuickSearchCodeToPartners1779000000000 implements MigrationInterface {
  name = 'AddQuickSearchCodeToPartners1779000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla partners existe
    const partnersTable = await queryRunner.getTable('partners');
    if (partnersTable) {
      // Agregar quickSearchCode a partners solo si no existe
      const quickSearchCodeColumn = partnersTable.findColumnByName('quickSearchCode');
      if (!quickSearchCodeColumn) {
        await queryRunner.addColumn(
          'partners',
          new TableColumn({
            name: 'quickSearchCode',
            type: 'varchar',
            length: '20',
            isNullable: true, // Temporalmente nullable para permitir migración de datos existentes
            comment: 'Código único de búsqueda rápida para el partner (formato: PARTNER-XXXXXX)',
          }),
        );

        // Generar códigos para partners existentes que no tengan código
        // Usar un formato similar al que se usa en la aplicación
        const partners = await queryRunner.query('SELECT id FROM partners WHERE quickSearchCode IS NULL');
        
        for (const partner of partners) {
          // Generar código único: PARTNER-{6 caracteres alfanuméricos sin confusión}
          const safeChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
          let code = '';
          for (let i = 0; i < 6; i++) {
            const randomIndex = Math.floor(Math.random() * safeChars.length);
            code += safeChars[randomIndex];
          }
          const quickSearchCode = `PARTNER-${code}`;
          
          // Verificar unicidad antes de asignar
          const existing = await queryRunner.query(
            'SELECT id FROM partners WHERE quickSearchCode = ?',
            [quickSearchCode],
          );
          
          if (existing.length === 0) {
            await queryRunner.query(
              'UPDATE partners SET quickSearchCode = ? WHERE id = ?',
              [quickSearchCode, partner.id],
            );
          } else {
            // Si hay colisión, generar otro código (máximo 10 intentos)
            let attempts = 0;
            let uniqueCode = quickSearchCode;
            while (attempts < 10) {
              code = '';
              for (let i = 0; i < 6; i++) {
                const randomIndex = Math.floor(Math.random() * safeChars.length);
                code += safeChars[randomIndex];
              }
              uniqueCode = `PARTNER-${code}`;
              const checkExisting = await queryRunner.query(
                'SELECT id FROM partners WHERE quickSearchCode = ?',
                [uniqueCode],
              );
              if (checkExisting.length === 0) {
                break;
              }
              attempts++;
            }
            await queryRunner.query(
              'UPDATE partners SET quickSearchCode = ? WHERE id = ?',
              [uniqueCode, partner.id],
            );
          }
        }

        // Después de migrar datos, hacer la columna NOT NULL
        await queryRunner.query(
          'ALTER TABLE partners MODIFY COLUMN quickSearchCode VARCHAR(20) NOT NULL',
        );

        // Crear índice único después de hacer la columna NOT NULL
        await queryRunner.createIndex(
          'partners',
          new TableIndex({
            name: 'IDX_PARTNERS_QUICK_SEARCH_CODE',
            columnNames: ['quickSearchCode'],
            isUnique: true,
          }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla partners existe
    const partnersTable = await queryRunner.getTable('partners');
    if (partnersTable) {
      // Eliminar índice primero
      const quickSearchCodeIndex = partnersTable.indices.find(
        (index) => index.name === 'IDX_PARTNERS_QUICK_SEARCH_CODE',
      );
      if (quickSearchCodeIndex) {
        await queryRunner.dropIndex('partners', 'IDX_PARTNERS_QUICK_SEARCH_CODE');
      }

      // Eliminar columna quickSearchCode si existe
      const quickSearchCodeColumn = partnersTable.findColumnByName('quickSearchCode');
      if (quickSearchCodeColumn) {
        await queryRunner.dropColumn('partners', 'quickSearchCode');
      }
    }
  }
}
