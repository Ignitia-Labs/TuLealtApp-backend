import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '@libs/application';

/**
 * Decorator para obtener el usuario autenticado del request
 *
 * El usuario se inyecta en el request por el JwtAuthGuard
 *
 * @example
 * @Get('me')
 * async getProfile(@CurrentUser() user: JwtPayload) {
 *   return this.getUserProfile(user.userId);
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
