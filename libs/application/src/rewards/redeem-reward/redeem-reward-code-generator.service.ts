import { Injectable, Inject } from '@nestjs/common';
import { IRedemptionCodeRepository } from '@libs/domain';

/**
 * Servicio para generar códigos únicos de canje
 */
@Injectable()
export class RedeemRewardCodeGeneratorService {
  constructor(
    @Inject('IRedemptionCodeRepository')
    private readonly redemptionCodeRepository: IRedemptionCodeRepository,
  ) {}

  /**
   * Genera un código único de canje
   * Formato: REWARD-{PREFIX}-{RANDOM}
   * - PREFIX: 3-4 caracteres alfanuméricos
   * - RANDOM: 6-8 caracteres alfanuméricos aleatorios
   * Total: 12-16 caracteres
   */
  async generateUniqueCode(tenantId?: number): Promise<string> {
    const maxAttempts = 5;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const code = this.generateCode(tenantId);
      const exists = await this.redemptionCodeRepository.existsByCode(code);

      if (!exists) {
        return code;
      }

      attempts++;
    }

    throw new Error(
      `Failed to generate unique redemption code after ${maxAttempts} attempts`,
    );
  }

  /**
   * Genera un código candidato
   */
  private generateCode(tenantId?: number): string {
    // Generar prefix (puede incluir hash de tenantId si se proporciona)
    const prefix = this.generatePrefix(tenantId);
    // Generar parte aleatoria
    const random = this.generateRandomPart();

    return `REWARD-${prefix}-${random}`;
  }

  /**
   * Genera un prefijo de 3-4 caracteres
   */
  private generatePrefix(tenantId?: number): string {
    if (tenantId) {
      // Usar hash simple del tenantId para consistencia
      const hash = this.simpleHash(tenantId.toString());
      return hash.substring(0, 4).toUpperCase();
    }
    // Si no hay tenantId, generar aleatorio
    return this.randomString(4).toUpperCase();
  }

  /**
   * Genera parte aleatoria de 6-8 caracteres
   */
  private generateRandomPart(): string {
    return this.randomString(8).toUpperCase();
  }

  /**
   * Genera una cadena aleatoria alfanumérica
   */
  private randomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Hash simple para generar prefijo consistente
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Convertir a base36 y asegurar que sea positivo
    return Math.abs(hash).toString(36).toUpperCase();
  }
}
