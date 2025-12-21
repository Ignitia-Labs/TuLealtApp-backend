import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno desde .env.local si existe (para desarrollo local)
if (process.env.NODE_ENV !== 'production') {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    dotenv.config({ path: envPath });
  } catch (error) {
    // Si no existe .env.local, usar variables de entorno del sistema
  }
}

/**
 * Configuración de DataSource para TypeORM CLI
 * Usado para ejecutar migraciones desde la línea de comandos
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'mariadb',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USER || 'tulealtapp',
  password: process.env.DB_PASSWORD || 'tulealtapp',
  database: process.env.DB_NAME || 'tulealtapp',
  entities: ['libs/infrastructure/src/persistence/entities/**/*.entity.ts'],
  migrations: ['libs/infrastructure/src/persistence/migrations/**/*.ts'],
  synchronize: false, // Nunca usar synchronize en migraciones
  logging: process.env.NODE_ENV !== 'production',
  migrationsTableName: 'migrations',
  migrationsRun: false,
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
