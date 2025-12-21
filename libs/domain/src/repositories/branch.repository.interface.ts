import { Branch } from '../entities/branch.entity';

/**
 * Interfaz del repositorio de Branch
 * Define los contratos para persistir y recuperar branches
 */
export interface IBranchRepository {
  /**
   * Guarda una nueva branch o actualiza una existente
   */
  save(branch: Branch): Promise<Branch>;

  /**
   * Actualiza una branch existente
   */
  update(branch: Branch): Promise<Branch>;

  /**
   * Busca una branch por su ID
   */
  findById(id: number): Promise<Branch | null>;

  /**
   * Busca todas las branches de un tenant
   */
  findByTenantId(tenantId: number): Promise<Branch[]>;

  /**
   * Obtiene todas las branches
   */
  findAll(): Promise<Branch[]>;
}
