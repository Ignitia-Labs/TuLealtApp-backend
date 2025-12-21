import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../types/jwt-payload.interface';

/**
 * Servicio para manejar operaciones con JWT
 * Proporciona métodos para generar y verificar tokens JWT
 */
@Injectable()
export class JwtAuthService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Genera un token JWT de acceso
   * @param payload Datos del usuario a incluir en el token
   * @returns Token JWT firmado
   */
  generateAccessToken(payload: JwtPayload): string {
    const tokenPayload: JwtPayload = {
      ...payload,
      type: 'access',
    };

    return this.jwtService.sign(tokenPayload);
  }

  /**
   * Verifica y decodifica un token JWT
   * @param token Token JWT a verificar
   * @returns Payload decodificado o null si el token es inválido
   */
  verifyToken(token: string): JwtPayload | null {
    try {
      const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
      return this.jwtService.verify<JwtPayload>(token, { secret });
    } catch (error) {
      return null;
    }
  }

  /**
   * Decodifica un token sin verificar (útil para debugging)
   * ⚠️ No usar en producción para validación
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.decode<JwtPayload>(token);
    } catch (error) {
      return null;
    }
  }
}
