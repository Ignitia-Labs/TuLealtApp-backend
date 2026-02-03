import { TierPolicy } from '@libs/domain/entities/tier/tier-policy.entity';

/**
 * Interfaz del repositorio para TierPolicy
 * Define los métodos que debe implementar cualquier repositorio de TierPolicy
 */
export interface ITierPolicyRepository {
  /**
   * Buscar política por ID
   */
  findById(id: number): Promise<TierPolicy | null>;

  /**
   * Buscar política activa por tenant
   */
  findActiveByTenantId(tenantId: number): Promise<TierPolicy | null>;

  /**
   * Buscar todas las políticas de un tenant
   */
  findByTenantId(tenantId: number): Promise<TierPolicy[]>;

  /**
   * Guardar política (crear o actualizar)
   */
  save(policy: TierPolicy): Promise<TierPolicy>;

  /**
   * Eliminar política
   */
  delete(id: number): Promise<void>;
}
