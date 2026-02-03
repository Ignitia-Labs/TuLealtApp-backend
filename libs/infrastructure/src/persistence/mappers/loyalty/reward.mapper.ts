import { Reward } from '@libs/domain';
import { RewardEntity } from '@libs/infrastructure/entities/loyalty/reward.entity';

/**
 * Mapper para convertir entre entidades de dominio y entidades de persistencia de Reward
 */
export class RewardMapper {
  /**
   * Convierte una entidad de persistencia a entidad de dominio
   */
  static toDomain(entity: RewardEntity): Reward {
    return Reward.create(
      entity.tenantId,
      entity.name,
      entity.pointsRequired,
      entity.stock,
      entity.category,
      entity.description,
      entity.image,
      entity.maxRedemptionsPerUser,
      entity.status as any,
      entity.terms,
      entity.validUntil,
      entity.id,
    );
  }

  /**
   * Convierte una entidad de dominio a entidad de persistencia (parcial)
   * Retorna un objeto parcial porque TypeORM maneja createdAt y updatedAt automáticamente
   */
  static toPersistence(domain: Reward): Partial<RewardEntity> {
    return {
      id: domain.id > 0 ? domain.id : undefined,
      tenantId: domain.tenantId,
      name: domain.name,
      description: domain.description,
      image: domain.image,
      pointsRequired: domain.pointsRequired,
      stock: domain.stock,
      maxRedemptionsPerUser: domain.maxRedemptionsPerUser,
      status: domain.status,
      category: domain.category,
      terms: domain.terms,
      validUntil: domain.validUntil,
    };
  }
}
