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
export * from './guards/permissions.guard';
export * from './guards/partner-resource.guard';

// Decorators
export * from './decorators/roles.decorator';
export * from './decorators/current-user.decorator';
export * from './decorators/resource-type.decorator';
export * from './decorators/permissions.decorator';
export * from './decorators/require-access.decorator';

// Pricing
export * from './pricing';

// Utils
export * from './utils/slug.util';
export * from './utils/qr-code.util';
export * from './utils/math.util';
export * from './utils/subscription-event.util';
