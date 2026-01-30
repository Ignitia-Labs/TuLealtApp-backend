import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { dataSourceOptions } from '../persistence/data-source';

// Cargar variables de entorno antes de inicializar la aplicación
if (process.env.NODE_ENV !== 'production') {
  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envLocalPath });

  if (!process.env.DB_HOST) {
    const envPath = path.resolve(process.cwd(), '.env');
    dotenv.config({ path: envPath });
  }
} else {
  dotenv.config();
}

/**
 * Script para migrar datos JSON a columnas y tablas relacionales en tier_benefits
 *
 * Este script ejecuta el SQL de migración de datos que convierte los campos JSON
 * en tier_benefits a las nuevas columnas y tablas relacionales.
 *
 * IMPORTANTE:
 * 1. Ejecutar DESPUÉS de la migración AddRelationalColumnsToTierBenefits
 * 2. Ejecutar DESPUÉS de crear backups con backup-json-fields.sql
 * 3. Verificar integridad de datos después de ejecutar
 *
 * Uso:
 * npm run script:migrate-tier-benefits-json
 */
async function migrateTierBenefitsJsonToRelational() {
  // Verificar que no estamos en producción
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ERROR: Este script NO puede ejecutarse en producción!');
    console.error('   NODE_ENV está configurado como "production"');
    process.exit(1);
  }

  const dbName = process.env.DB_NAME || 'tulealtapp';
  console.log('========================================');
  console.log('🔄 Migrando Datos JSON → Relacional');
  console.log('========================================');
  console.log(`📦 Base de datos: ${dbName}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log('========================================\n');

  const dataSource = new DataSource(dataSourceOptions);

  try {
    // Conectar a la base de datos
    console.log('🔌 Conectando a la base de datos...');
    await dataSource.initialize();
    console.log('✅ Conectado exitosamente\n');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Leer el script SQL
      const sqlPath = path.resolve(
        __dirname,
        '../persistence/migrations/scripts/migrate-tier-benefits-json-to-relational.sql',
      );

      if (!fs.existsSync(sqlPath)) {
        throw new Error(`Script SQL no encontrado en: ${sqlPath}`);
      }

      console.log(`📄 Leyendo script SQL: ${sqlPath}\n`);
      const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

      // Dividir el script en statements (separados por ;)
      // Filtrar comentarios y líneas vacías
      const statements = sqlContent
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

      console.log(`📊 Encontrados ${statements.length} statements SQL\n`);

      // Ejecutar cada statement
      let executedCount = 0;
      let errorCount = 0;

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];

        // Saltar comentarios y validaciones SELECT (las ejecutaremos después)
        if (
          statement.startsWith('SELECT') &&
          (statement.includes('CASE') || statement.includes('estado_'))
        ) {
          // Estas son queries de validación, las ejecutaremos al final
          continue;
        }

        try {
          // Ejecutar statement
          const result = await queryRunner.query(statement + ';');

          // Mostrar resultado si es un UPDATE o INSERT
          if (statement.toUpperCase().startsWith('UPDATE')) {
            console.log(`  ✓ UPDATE ejecutado (${i + 1}/${statements.length})`);
            if (result.affectedRows !== undefined) {
              console.log(`    → ${result.affectedRows} filas afectadas`);
            }
          } else if (statement.toUpperCase().startsWith('INSERT')) {
            console.log(`  ✓ INSERT ejecutado (${i + 1}/${statements.length})`);
            if (result.affectedRows !== undefined) {
              console.log(`    → ${result.affectedRows} filas insertadas`);
            }
          } else if (!statement.toUpperCase().startsWith('CREATE') && !statement.toUpperCase().startsWith('ALTER')) {
            // Solo mostrar para statements que no sean CREATE/ALTER (ya ejecutados en migración)
            console.log(`  ✓ Statement ejecutado (${i + 1}/${statements.length})`);
          }

          executedCount++;
        } catch (error: any) {
          errorCount++;
          console.error(`  ❌ Error en statement ${i + 1}:`);
          console.error(`     ${error.message}`);

          // Si es un error crítico, detener la ejecución
          if (error.message.includes('does not exist') || error.message.includes('Unknown column')) {
            console.error('\n❌ Error crítico detectado. Deteniendo migración.');
            throw error;
          }
        }
      }

      console.log('\n========================================');
      console.log(`✅ Migración de datos completada`);
      console.log(`   → ${executedCount} statements ejecutados`);
      if (errorCount > 0) {
        console.log(`   ⚠️  ${errorCount} errores (no críticos)`);
      }
      console.log('========================================\n');

      // Ejecutar queries de validación
      console.log('🔍 Ejecutando validaciones...\n');

      const validationQueries = [
        `SELECT COUNT(*) as total_registros FROM tier_benefits`,
        `SELECT COUNT(*) as total_exclusive_rewards FROM tier_benefit_exclusive_rewards`,
        `SELECT COUNT(*) as total_category_benefits FROM tier_benefit_category_benefits`,
        `SELECT COUNT(*) as total_registros, COUNT(CASE WHEN higherCaps IS NOT NULL THEN 1 END) as con_higher_caps_json FROM tier_benefits`,
        `SELECT COUNT(*) as total_registros, COUNT(CASE WHEN higher_caps_max_points_per_event IS NOT NULL THEN 1 END) as con_higher_caps_relacional FROM tier_benefits`,
      ];

      for (const query of validationQueries) {
        try {
          const result = await queryRunner.query(query);
          console.log(`  ✓ ${query}`);
          if (Array.isArray(result) && result.length > 0) {
            console.log(`    → Resultado:`, result[0]);
          }
        } catch (error: any) {
          console.error(`  ⚠️  Error en validación: ${error.message}`);
        }
      }

      console.log('\n========================================');
      console.log('✅ Migración completada exitosamente');
      console.log('========================================');
      console.log('\n💡 Próximos pasos:');
      console.log('   1. Verificar que los datos se migraron correctamente');
      console.log('   2. Ejecutar tests para validar la funcionalidad');
      console.log('   3. Después de validar, hacer columnas NOT NULL');
      console.log('   4. Finalmente, remover columnas JSON antiguas');
      console.log('========================================\n');
    } finally {
      await queryRunner.release();
    }

    await dataSource.destroy();
  } catch (error) {
    console.error('\n========================================');
    console.error('❌ Error al migrar datos:');
    console.error('========================================');
    console.error(error);
    process.exit(1);
  }
}

// Solo ejecutar si el archivo se ejecuta directamente
if (require.main === module) {
  migrateTierBenefitsJsonToRelational()
    .then(() => {
      console.log('✅ Script completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

export { migrateTierBenefitsJsonToRelational };
