import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
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
 * Script para limpiar toda la data de la base de datos (SOLO PARA DESARROLLO)
 *
 * ⚠️ ADVERTENCIA: Este script elimina TODOS los datos de la base de datos.
 * Solo debe ejecutarse en entornos de desarrollo.
 *
 * Uso:
 * npm run script:clean-db
 */
async function cleanDatabase() {
  // Verificar que no estamos en producción
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ERROR: Este script NO puede ejecutarse en producción!');
    console.error('   NODE_ENV está configurado como "production"');
    process.exit(1);
  }

  // Verificar que la base de datos no sea de producción
  const dbName = process.env.DB_NAME || 'tulealtapp';
  if (dbName.includes('prod') || dbName.includes('production')) {
    console.error('❌ ERROR: Este script NO puede ejecutarse en base de datos de producción!');
    console.error(`   DB_NAME es: ${dbName}`);
    process.exit(1);
  }

  console.log('========================================');
  console.log('🧹 Limpiando Base de Datos');
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
      // Obtener todas las tablas (excepto migrations)
      console.log('📋 Obteniendo lista de tablas...');
      const tables = await queryRunner.getTables();
      const tablesToClean = tables.filter(
        (table) => table.name !== 'migrations' && !table.name.startsWith('migrations'),
      );

      console.log(`📊 Encontradas ${tablesToClean.length} tablas para limpiar\n`);

      if (tablesToClean.length === 0) {
        console.log('ℹ️  No hay tablas para limpiar');
        return;
      }

      // Desactivar foreign key checks temporalmente
      console.log('🔓 Desactivando verificación de foreign keys...');
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');
      console.log('✅ Foreign keys desactivadas\n');

      // Limpiar cada tabla
      let cleanedCount = 0;
      for (const table of tablesToClean) {
        try {
          await queryRunner.query(`TRUNCATE TABLE \`${table.name}\``);
          cleanedCount++;
          console.log(`  ✓ ${table.name}`);
        } catch (error: any) {
          console.log(`  ⚠️  ${table.name}: ${error.message}`);
        }
      }

      // Reactivar foreign key checks
      console.log('\n🔒 Reactivando verificación de foreign keys...');
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
      console.log('✅ Foreign keys reactivadas\n');

      console.log('========================================');
      console.log(`✅ Limpieza completada: ${cleanedCount} tablas limpiadas`);
      console.log('========================================');
      console.log('\n💡 Próximos pasos:');
      console.log('   1. Ejecutar migraciones: npm run migration:run');
      console.log('   2. Ejecutar seeds: npm run seed:all');
      console.log('========================================\n');
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('\n========================================');
    console.error('❌ Error al limpiar la base de datos:');
    console.error('========================================');
    console.error(error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

// Solo ejecutar si el archivo se ejecuta directamente
if (require.main === module) {
  cleanDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

export { cleanDatabase };

