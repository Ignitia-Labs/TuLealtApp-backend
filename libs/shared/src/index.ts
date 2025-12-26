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

// Decorators
export * from './decorators/roles.decorator';
export * from './decorators/current-user.decorator';

// Pricing
export * from './pricing';
