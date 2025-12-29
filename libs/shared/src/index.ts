/**
 * Shared Layer - Public API
 * Exporta utilidades, filtros, interceptores y tipos comunes
 */

// Filters
export * from './filters/http-exception.filter';

// Interceptors
export * from './interceptors/transform.interceptor';

// Controllers
export * from './controllers/health.controller';

// Types
export * from './types/common.types';
export * from './types/error-response.dto';
export {
  ErrorResponseDto,
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  BadRequestErrorResponseDto,
  InternalServerErrorResponseDto,
} from './types/error-response.dto';

// Guards
export * from './guards/jwt-auth.guard';
export * from './guards/roles.guard';
export * from './guards/customer-resource.guard';
export * from './guards/membership-ownership.guard';

// Decorators
export * from './decorators/roles.decorator';
export * from './decorators/current-user.decorator';
export * from './decorators/resource-type.decorator';

// Pricing
export * from './pricing';

// Utils
export * from './utils/slug.util';
export * from './utils/qr-code.util';
