import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { dataSourceOptions } from '../persistence/data-source';
import { execSync } from 'child_process';

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
 * Script para resetear completamente la base de datos (SOLO PARA DESARROLLO)
 *
 * Este script:
 * 1. Elimina todas las tablas (incluyendo migrations)
 * 2. Ejecuta todas las migraciones desde cero
 * 3. Opcionalmente ejecuta los seeds
 *
 * ⚠️ ADVERTENCIA: Este script elimina TODA la estructura y datos de la base de datos.
 * Solo debe ejecutarse en entornos de desarrollo.
 *
 * Uso:
 * npm run script:reset-db [--with-seeds]
 */
async function resetDatabase() {
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

  const withSeeds = process.argv.includes('--with-seeds');

  console.log('========================================');
  console.log('🔄 Reseteando Base de Datos');
  console.log('========================================');
  console.log(`📦 Base de datos: ${dbName}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌱 Seeds: ${withSeeds ? 'SÍ' : 'NO'}`);
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
      // Obtener todas las tablas
      console.log('📋 Obteniendo lista de tablas...');
      const tables = await queryRunner.getTables();
      console.log(`📊 Encontradas ${tables.length} tablas\n`);

      if (tables.length === 0) {
        console.log('ℹ️  No hay tablas para eliminar');
      } else {
        // Desactivar foreign key checks temporalmente
        console.log('🔓 Desactivando verificación de foreign keys...');
        await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');
        console.log('✅ Foreign keys desactivadas\n');

        // Eliminar cada tabla
        console.log('🗑️  Eliminando tablas...');
        let droppedCount = 0;
        for (const table of tables) {
          try {
            await queryRunner.query(`DROP TABLE IF EXISTS \`${table.name}\``);
            droppedCount++;
            console.log(`  ✓ ${table.name}`);
          } catch (error: any) {
            console.log(`  ⚠️  ${table.name}: ${error.message}`);
          }
        }

        // Reactivar foreign key checks
        console.log('\n🔒 Reactivando verificación de foreign keys...');
        await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ Foreign keys reactivadas\n');

        console.log(`✅ ${droppedCount} tablas eliminadas\n`);
      }
    } finally {
      await queryRunner.release();
    }

    // Cerrar conexión antes de ejecutar migraciones
    await dataSource.destroy();

    // Ejecutar migraciones
    console.log('========================================');
    console.log('🔄 Ejecutando migraciones...');
    console.log('========================================\n');
    try {
      execSync('npm run migration:run', { stdio: 'inherit' });
      console.log('\n✅ Migraciones ejecutadas exitosamente\n');
    } catch (error) {
      console.error('\n❌ Error al ejecutar migraciones');
      throw error;
    }

    // Ejecutar seeds si se solicita
    if (withSeeds) {
      console.log('========================================');
      console.log('🌱 Ejecutando seeds...');
      console.log('========================================\n');
      try {
        execSync('npm run seed:all', { stdio: 'inherit' });
        console.log('\n✅ Seeds ejecutados exitosamente\n');
      } catch (error) {
        console.error('\n❌ Error al ejecutar seeds');
        throw error;
      }
    }

    console.log('========================================');
    console.log('✅ Reseteo completado exitosamente');
    console.log('========================================');
    if (!withSeeds) {
      console.log('\n💡 Para ejecutar seeds: npm run seed:all');
    }
    console.log('========================================\n');
  } catch (error) {
    console.error('\n========================================');
    console.error('❌ Error al resetear la base de datos:');
    console.error('========================================');
    console.error(error);
    process.exit(1);
  }
}

// Solo ejecutar si el archivo se ejecuta directamente
if (require.main === module) {
  resetDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

export { resetDatabase };

