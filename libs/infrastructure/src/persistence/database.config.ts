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
  const isProduction = process.env.NODE_ENV === 'production';

  // IMPORTANTE: Desactivar synchronize cuando se usan migraciones
  // Las migraciones son la fuente de verdad para el esquema de la base de datos
  // synchronize solo debe usarse en desarrollo TEMPORAL cuando NO hay migraciones
  // Si tienes migraciones ejecutadas, synchronize debe estar en false para evitar conflictos
  const synchronize = process.env.DB_SYNCHRONIZE === 'true' && !isProduction;

  return {
    type: 'mariadb',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USER || 'tulealtapp',
    password: process.env.DB_PASSWORD || 'tulealtapp',
    database: process.env.DB_NAME || 'tulealtapp',
    entities: [UserEntity],
    synchronize, // Por defecto false - solo activar explícitamente con DB_SYNCHRONIZE=true
    logging: !isProduction, // Logging en desarrollo
    retryAttempts: 3,
    retryDelay: 3000,
    autoLoadEntities: true,
  };
};
