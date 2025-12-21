import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '@libs/application';

/**
 * Estrategia JWT para Customer API
 * Valida tokens JWT y verifica que el contexto sea 'customer'
 */
@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Valida el payload del token JWT
   * Verifica que el contexto sea 'customer'
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // Verificar que el contexto sea customer
    if (payload.context !== 'customer') {
      throw new UnauthorizedException('Token is not valid for customer context');
    }

    // Verificar que el token sea de tipo access
    if (payload.type && payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    return payload;
  }
}
