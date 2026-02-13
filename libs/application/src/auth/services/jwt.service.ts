import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../types/jwt-payload.interface';

/**
 * Servicio para manejar operaciones con JWT
 * Proporciona métodos para generar y verificar access tokens y refresh tokens
 */
@Injectable()
export class JwtAuthService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Genera un token JWT de acceso (access token)
   * Duración: 15 minutos (por defecto)
   * @param payload Datos del usuario a incluir en el token
   * @returns Access token JWT firmado
   */
  generateAccessToken(payload: JwtPayload): string {
    const tokenPayload: JwtPayload = {
      ...payload,
      type: 'access',
    };

    // Access token expira en 15 minutos
    const expiresIn = (process.env.JWT_ACCESS_TOKEN_EXPIRATION || '15m') as string;

    return this.jwtService.sign(tokenPayload as any, { expiresIn } as any);
  }

  /**
   * Genera un token JWT de refresco (refresh token)
   * Duración: 7 días (por defecto)
   * @param payload Datos del usuario a incluir en el token
   * @returns Refresh token JWT firmado
   */
  generateRefreshToken(payload: Omit<JwtPayload, 'type'>): string {
    const tokenPayload: JwtPayload = {
      ...payload,
      type: 'refresh',
    };

    // Refresh token expira en 7 días
    const expiresIn = (process.env.JWT_REFRESH_TOKEN_EXPIRATION || '7d') as string;

    return this.jwtService.sign(tokenPayload as any, { expiresIn } as any);
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
   * Verifica y decodifica un access token
   * Valida que el tipo sea 'access'
   * @param token Access token a verificar
   * @returns Payload decodificado o null si el token es inválido o no es un access token
   */
  verifyAccessToken(token: string): JwtPayload | null {
    const payload = this.verifyToken(token);

    if (!payload || payload.type !== 'access') {
      return null;
    }

    return payload;
  }

  /**
   * Verifica y decodifica un refresh token
   * Valida que el tipo sea 'refresh'
   * @param token Refresh token a verificar
   * @returns Payload decodificado o null si el token es inválido o no es un refresh token
   */
  verifyRefreshToken(token: string): JwtPayload | null {
    const payload = this.verifyToken(token);

    if (!payload || payload.type !== 'refresh') {
      return null;
    }

    return payload;
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

  /**
   * Calcula la fecha de expiración del refresh token
   * @returns Fecha de expiración (7 días en el futuro por defecto)
   */
  getRefreshTokenExpirationDate(): Date {
    const expirationString = process.env.JWT_REFRESH_TOKEN_EXPIRATION || '7d';

    // Parsear el string de expiración (ej: "7d", "24h", "60m")
    const match = expirationString.match(/^(\d+)([dhms])$/);

    if (!match) {
      // Default: 7 días
      const now = new Date();
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const now = new Date();
    let milliseconds = 0;

    switch (unit) {
      case 'd': // días
        milliseconds = value * 24 * 60 * 60 * 1000;
        break;
      case 'h': // horas
        milliseconds = value * 60 * 60 * 1000;
        break;
      case 'm': // minutos
        milliseconds = value * 60 * 1000;
        break;
      case 's': // segundos
        milliseconds = value * 1000;
        break;
    }

    return new Date(now.getTime() + milliseconds);
  }
}
