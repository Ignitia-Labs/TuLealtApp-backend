import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

/**
 * Migración para mover quickSearchCode de partners a tenants y branches
 * - Agrega quickSearchCode a tenants (formato: TENANT-XXXXXX)
 * - Agrega quickSearchCode a branches (formato: BRANCH-XXXXXX)
 * - Elimina quickSearchCode de partners
 */
export class MoveQuickSearchCodeToTenantAndBranch1781000000000 implements MigrationInterface {
  name = 'MoveQuickSearchCodeToTenantAndBranch1781000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const safeChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    // Función helper para generar código único
    const generateUniqueCode = async (
      prefix: string,
      existingCodes: Set<string>,
      maxAttempts: number = 10,
    ): Promise<string> => {
      let attempts = 0;
      while (attempts < maxAttempts) {
        let code = '';
        for (let i = 0; i < 6; i++) {
          const randomIndex = Math.floor(Math.random() * safeChars.length);
          code += safeChars[randomIndex];
        }
        const fullCode = `${prefix}-${code}`;
        if (!existingCodes.has(fullCode)) {
          existingCodes.add(fullCode);
          return fullCode;
        }
        attempts++;
      }
      throw new Error(`Failed to generate unique code after ${maxAttempts} attempts`);
    };

    // 1. Agregar quickSearchCode a tenants (nullable temporalmente)
    const tenantsTable = await queryRunner.getTable('tenants');
    if (tenantsTable) {
      const tenantQuickSearchCodeColumn = tenantsTable.findColumnByName('quickSearchCode');
      if (!tenantQuickSearchCodeColumn) {
        await queryRunner.addColumn(
          'tenants',
          new TableColumn({
            name: 'quickSearchCode',
            type: 'varchar',
            length: '20',
            isNullable: true, // Temporalmente nullable para permitir migración
            comment: 'Código único de búsqueda rápida para el tenant (formato: TENANT-XXXXXX)',
          }),
        );
      }
    }

    // 2. Agregar quickSearchCode a branches (nullable temporalmente)
    const branchesTable = await queryRunner.getTable('branches');
    if (branchesTable) {
      const branchQuickSearchCodeColumn = branchesTable.findColumnByName('quickSearchCode');
      if (!branchQuickSearchCodeColumn) {
        await queryRunner.addColumn(
          'branches',
          new TableColumn({
            name: 'quickSearchCode',
            type: 'varchar',
            length: '20',
            isNullable: true, // Temporalmente nullable para permitir migración
            comment: 'Código único de búsqueda rápida para la branch (formato: BRANCH-XXXXXX)',
          }),
        );
      }
    }

    // 3. Obtener todos los códigos existentes (de partners, tenants y branches) para evitar colisiones
    const existingCodes = new Set<string>();

    // Códigos existentes de partners (si existen)
    const partnersWithCodes = await queryRunner.query(
      'SELECT quickSearchCode FROM partners WHERE quickSearchCode IS NOT NULL',
    );
    partnersWithCodes.forEach((row: { quickSearchCode: string }) => {
      existingCodes.add(row.quickSearchCode);
    });

    // Códigos existentes de tenants (si ya existen)
    const tenantsWithCodes = await queryRunner.query(
      'SELECT quickSearchCode FROM tenants WHERE quickSearchCode IS NOT NULL',
    );
    tenantsWithCodes.forEach((row: { quickSearchCode: string }) => {
      existingCodes.add(row.quickSearchCode);
    });

    // Códigos existentes de branches (si ya existen)
    const branchesWithCodes = await queryRunner.query(
      'SELECT quickSearchCode FROM branches WHERE quickSearchCode IS NOT NULL',
    );
    branchesWithCodes.forEach((row: { quickSearchCode: string }) => {
      existingCodes.add(row.quickSearchCode);
    });

    // 4. Generar códigos para tenants existentes que no tengan código
    const tenants = await queryRunner.query('SELECT id FROM tenants WHERE quickSearchCode IS NULL');

    for (const tenant of tenants) {
      try {
        const tenantCode = await generateUniqueCode('TENANT', existingCodes);
        await queryRunner.query('UPDATE tenants SET quickSearchCode = ? WHERE id = ?', [
          tenantCode,
          tenant.id,
        ]);
      } catch (error) {
        console.error(`Error generating code for tenant ${tenant.id}:`, error);
        // Continuar con el siguiente tenant
      }
    }

    // 5. Generar códigos para branches existentes que no tengan código
    const branches = await queryRunner.query(
      'SELECT id FROM branches WHERE quickSearchCode IS NULL',
    );

    for (const branch of branches) {
      try {
        const branchCode = await generateUniqueCode('BRANCH', existingCodes);
        await queryRunner.query('UPDATE branches SET quickSearchCode = ? WHERE id = ?', [
          branchCode,
          branch.id,
        ]);
      } catch (error) {
        console.error(`Error generating code for branch ${branch.id}:`, error);
        // Continuar con la siguiente branch
      }
    }

    // 6. Hacer quickSearchCode NOT NULL en tenants
    await queryRunner.query(
      'ALTER TABLE tenants MODIFY COLUMN quickSearchCode VARCHAR(20) NOT NULL',
    );

    // 7. Hacer quickSearchCode NOT NULL en branches
    await queryRunner.query(
      'ALTER TABLE branches MODIFY COLUMN quickSearchCode VARCHAR(20) NOT NULL',
    );

    // 8. Crear índices únicos
    const tenantsTableAfter = await queryRunner.getTable('tenants');
    if (tenantsTableAfter) {
      const tenantIndex = tenantsTableAfter.indices.find(
        (index) => index.name === 'IDX_TENANTS_QUICK_SEARCH_CODE',
      );
      if (!tenantIndex) {
        await queryRunner.createIndex(
          'tenants',
          new TableIndex({
            name: 'IDX_TENANTS_QUICK_SEARCH_CODE',
            columnNames: ['quickSearchCode'],
            isUnique: true,
          }),
        );
      }
    }

    const branchesTableAfter = await queryRunner.getTable('branches');
    if (branchesTableAfter) {
      const branchIndex = branchesTableAfter.indices.find(
        (index) => index.name === 'IDX_BRANCHES_QUICK_SEARCH_CODE',
      );
      if (!branchIndex) {
        await queryRunner.createIndex(
          'branches',
          new TableIndex({
            name: 'IDX_BRANCHES_QUICK_SEARCH_CODE',
            columnNames: ['quickSearchCode'],
            isUnique: true,
          }),
        );
      }
    }

    // 9. Eliminar quickSearchCode de partners
    const partnersTable = await queryRunner.getTable('partners');
    if (partnersTable) {
      // Eliminar índice primero
      const partnerQuickSearchCodeIndex = partnersTable.indices.find(
        (index) => index.name === 'IDX_PARTNERS_QUICK_SEARCH_CODE',
      );
      if (partnerQuickSearchCodeIndex) {
        await queryRunner.dropIndex('partners', 'IDX_PARTNERS_QUICK_SEARCH_CODE');
      }

      // Eliminar columna
      const partnerQuickSearchCodeColumn = partnersTable.findColumnByName('quickSearchCode');
      if (partnerQuickSearchCodeColumn) {
        await queryRunner.dropColumn('partners', 'quickSearchCode');
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar quickSearchCode de vuelta a partners
    const partnersTable = await queryRunner.getTable('partners');
    if (partnersTable) {
      const partnerQuickSearchCodeColumn = partnersTable.findColumnByName('quickSearchCode');
      if (!partnerQuickSearchCodeColumn) {
        await queryRunner.addColumn(
          'partners',
          new TableColumn({
            name: 'quickSearchCode',
            type: 'varchar',
            length: '20',
            isNullable: true,
            comment: 'Código único de búsqueda rápida para el partner (formato: PARTNER-XXXXXX)',
          }),
        );

        // Crear índice
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

    // 2. Eliminar índices de tenants y branches
    const tenantsTable = await queryRunner.getTable('tenants');
    if (tenantsTable) {
      const tenantIndex = tenantsTable.indices.find(
        (index) => index.name === 'IDX_TENANTS_QUICK_SEARCH_CODE',
      );
      if (tenantIndex) {
        await queryRunner.dropIndex('tenants', 'IDX_TENANTS_QUICK_SEARCH_CODE');
      }
    }

    const branchesTable = await queryRunner.getTable('branches');
    if (branchesTable) {
      const branchIndex = branchesTable.indices.find(
        (index) => index.name === 'IDX_BRANCHES_QUICK_SEARCH_CODE',
      );
      if (branchIndex) {
        await queryRunner.dropIndex('branches', 'IDX_BRANCHES_QUICK_SEARCH_CODE');
      }
    }

    // 3. Eliminar columnas de tenants y branches
    if (tenantsTable) {
      const tenantQuickSearchCodeColumn = tenantsTable.findColumnByName('quickSearchCode');
      if (tenantQuickSearchCodeColumn) {
        await queryRunner.dropColumn('tenants', 'quickSearchCode');
      }
    }

    if (branchesTable) {
      const branchQuickSearchCodeColumn = branchesTable.findColumnByName('quickSearchCode');
      if (branchQuickSearchCodeColumn) {
        await queryRunner.dropColumn('branches', 'quickSearchCode');
      }
    }
  }
}
