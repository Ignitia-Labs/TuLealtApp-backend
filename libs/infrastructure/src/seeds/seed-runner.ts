import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { SeedsModule } from './seeds.module';
import { AdminUserSeed } from './shared/admin-user.seed';
import { CurrencySeed } from './shared/currency.seed';
import { CountrySeed } from './shared/country.seed';
import { CatalogSeed } from './shared/catalog.seed';
import { ProfilesSeed } from './shared/profiles.seed';
import { AdminSeed } from './admin/admin.seed';
import { PartnerSeed } from './partner/partner.seed';
import { CustomerSeed } from './customer/customer.seed';

// Cargar variables de entorno antes de inicializar la aplicación
// Prioridad: .env.local > .env > variables de entorno del sistema
if (process.env.NODE_ENV !== 'production') {
  // Intentar cargar .env.local primero
  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envLocalPath });

  // Si no existe .env.local, cargar .env
  if (!process.env.DB_HOST) {
    const envPath = path.resolve(process.cwd(), '.env');
    dotenv.config({ path: envPath });
  }
} else {
  // En producción, solo usar variables de entorno del sistema
  dotenv.config();
}

/**
 * Contextos disponibles para ejecutar seeds
 */
export enum SeedContext {
  ALL = 'all',
  ADMIN = 'admin',
  PARTNER = 'partner',
  CUSTOMER = 'customer',
  COUNTRY = 'country',
  CURRENCY = 'currency',
  CATALOG = 'catalog',
  PROFILES = 'profiles',
}

/**
 * Runner principal para ejecutar seeds
 *
 * Uso:
 * - ts-node -r tsconfig-paths/register libs/infrastructure/src/seeds/seed-runner.ts all
 * - ts-node -r tsconfig-paths/register libs/infrastructure/src/seeds/seed-runner.ts admin
 * - ts-node -r tsconfig-paths/register libs/infrastructure/src/seeds/seed-runner.ts partner
 * - ts-node -r tsconfig-paths/register libs/infrastructure/src/seeds/seed-runner.ts customer
 * - ts-node -r tsconfig-paths/register libs/infrastructure/src/seeds/seed-runner.ts country
 * - ts-node -r tsconfig-paths/register libs/infrastructure/src/seeds/seed-runner.ts currency
 * - ts-node -r tsconfig-paths/register libs/infrastructure/src/seeds/seed-runner.ts catalog
 */
async function bootstrap() {
  const context = (process.argv[2] || SeedContext.ALL) as SeedContext;

  console.log('========================================');
  console.log('🌱 Ejecutando Seeds');
  console.log(`📦 Contexto: ${context}`);
  console.log('========================================\n');

  try {
    // Crear aplicación NestJS para tener acceso a la inyección de dependencias
    // Usar SeedsModule en lugar de InfrastructureModule para evitar cargar seeds
    // en las aplicaciones normales
    const app = await NestFactory.createApplicationContext(SeedsModule, {
      logger: ['log', 'error', 'warn'],
    });

    // Obtener las seeds del contenedor de dependencias
    const adminUserSeed = app.get(AdminUserSeed);
    const currencySeed = app.get(CurrencySeed);
    const countrySeed = app.get(CountrySeed);
    const catalogSeed = app.get(CatalogSeed);
    const profilesSeed = app.get(ProfilesSeed);
    const adminSeed = app.get(AdminSeed);
    const partnerSeed = app.get(PartnerSeed);
    const customerSeed = app.get(CustomerSeed);

    // Ejecutar seeds según el contexto
    switch (context) {
      case SeedContext.ADMIN:
        await adminSeed.run();
        break;

      case SeedContext.PARTNER:
        await partnerSeed.run();
        break;

      case SeedContext.CUSTOMER:
        await customerSeed.run();
        break;

      case SeedContext.COUNTRY:
        await countrySeed.run();
        break;

      case SeedContext.CURRENCY:
        await currencySeed.run();
        break;

      case SeedContext.CATALOG:
        await catalogSeed.run();
        break;

      case SeedContext.PROFILES:
        await profilesSeed.run();
        break;

      case SeedContext.ALL:
      default:
        console.log('Ejecutando todas las seeds...\n');
        await adminSeed.run();
        console.log('');
        await partnerSeed.run();
        console.log('');
        await customerSeed.run();
        break;
    }

    console.log('\n========================================');
    console.log('✅ Seeds ejecutadas exitosamente');
    console.log('========================================');

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('\n========================================');
    console.error('❌ Error al ejecutar seeds:', error);
    console.error('========================================');
    process.exit(1);
  }
}

// Solo ejecutar bootstrap si el archivo se ejecuta directamente (no cuando se importa)
// Esto evita que las seeds se ejecuten automáticamente al importar el módulo
if (require.main === module) {
  bootstrap();
}
