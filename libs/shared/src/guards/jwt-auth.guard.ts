import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * Guard para validar tokens JWT
 * Extiende AuthGuard de Passport para usar estrategias JWT
 *
 * Si el token es válido, inyecta el usuario en request.user
 * Valida que solo se usen access tokens (no refresh tokens)
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // Si hay un error o no hay usuario, lanzar excepción
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or expired token');
    }

    // Validar que el token sea de tipo 'access' (no 'refresh')
    if (user.type && user.type !== 'access') {
      throw new UnauthorizedException('Invalid token type. Use access token for authentication.');
    }

    return user;
  }
}
