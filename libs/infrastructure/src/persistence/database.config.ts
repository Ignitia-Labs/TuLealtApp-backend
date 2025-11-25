import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
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
 * Configuración de la base de datos
 * Lee las variables de entorno para configurar la conexión
 * Prioridad: variables de entorno del sistema > .env.local > valores por defecto
 */
export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  // Activar synchronize cuando NO esté en producción
  // Esto permite crear tablas automáticamente en desarrollo y al ejecutar seeds
  const isProduction = process.env.NODE_ENV === 'production';
  const synchronize = !isProduction;

  return {
    type: 'mariadb',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USER || 'tulealtapp',
    password: process.env.DB_PASSWORD || 'tulealtapp',
    database: process.env.DB_NAME || 'tulealtapp',
    entities: [UserEntity],
    synchronize, // Crea/actualiza tablas automáticamente en desarrollo
    logging: !isProduction, // Logging en desarrollo
    retryAttempts: 3,
    retryDelay: 3000,
    autoLoadEntities: true,
  };
};
