/**
 * Seeds Module - Public API
 * Exporta todas las seeds y utilidades relacionadas
 *
 * ⚠️ IMPORTANTE: El seed-runner NO se exporta aquí para evitar
 * que se ejecute automáticamente al importar el módulo.
 * Las seeds solo deben ejecutarse mediante: npm run seed:*
 */

// Interfaces
export * from './interfaces/seed.interface';

// Base classes
export * from './base/base-seed';

// Shared seeds
export * from './shared/admin-user.seed';
export * from './shared/pricing-plan.seed';
export * from './shared/currency.seed';

// Context-specific seeds
export * from './admin/admin.seed';
export * from './partner/partner.seed';
export * from './customer/customer.seed';

// NO exportar seed-runner aquí para evitar ejecución automática
// El seed-runner se ejecuta directamente mediante ts-node
