import { RedemptionCode } from '@libs/domain';
import { RedemptionCodeEntity } from '@libs/infrastructure/entities/loyalty/redemption-code.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia de RedemptionCode
 */
export class RedemptionCodeMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(entity: RedemptionCodeEntity): RedemptionCode {
    // Usar el constructor directamente porque create() solo crea códigos nuevos con status 'pending'
    return new RedemptionCode(
      entity.id,
      entity.code,
      entity.transactionId,
      entity.rewardId,
      entity.membershipId,
      entity.tenantId,
      entity.status,
      entity.expiresAt,
      entity.usedAt,
      entity.usedBy,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia (parcial)
   * Retorna un objeto parcial porque TypeORM maneja createdAt y updatedAt automáticamente
   */
  static toPersistence(domain: RedemptionCode): Partial<RedemptionCodeEntity> {
    return {
      id: domain.id > 0 ? domain.id : undefined,
      code: domain.code,
      transactionId: domain.transactionId,
      rewardId: domain.rewardId,
      membershipId: domain.membershipId,
      tenantId: domain.tenantId,
      status: domain.status,
      expiresAt: domain.expiresAt,
      usedAt: domain.usedAt,
      usedBy: domain.usedBy,
    };
  }
}
