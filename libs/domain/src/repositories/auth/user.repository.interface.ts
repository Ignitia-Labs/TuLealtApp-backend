import { User } from '@libs/domain/entities/auth/user.entity';

/**
 * Interfaz del repositorio de usuarios
 * Define el contrato que debe cumplir cualquier implementación
 * La implementación concreta estará en la capa de infraestructura
 */
export interface IUserRepository {
  /**
   * Busca un usuario por su ID
   */
  findById(id: number): Promise<User | null>;

  /**
   * Busca un usuario por su email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Busca todos los usuarios (con paginación opcional)
   */
  findAll(skip?: number, take?: number): Promise<User[]>;

  /**
   * Guarda un nuevo usuario
   */
  save(user: User): Promise<User>;

  /**
   * Actualiza un usuario existente
   */
  update(user: User): Promise<User>;

  /**
   * Elimina un usuario por su ID
   */
  delete(id: number): Promise<void>;

  /**
   * Cuenta el total de usuarios
   */
  count(): Promise<number>;

  /**
   * Busca usuarios por roles (array de roles)
   * Retorna usuarios que tengan al menos uno de los roles especificados
   */
  findByRoles(roles: string[], skip?: number, take?: number): Promise<User[]>;

  /**
   * Cuenta usuarios por roles (array de roles)
   * Retorna el total de usuarios que tengan al menos uno de los roles especificados
   */
  countByRoles(roles: string[]): Promise<number>;

  /**
   * Busca usuarios por partnerId y roles (array de roles)
   * Retorna usuarios que pertenezcan al partner y tengan al menos uno de los roles especificados
   * @param includeInactive Si es true, incluye usuarios inactivos/bloqueados. Por defecto true (incluye todos).
   */
  findByPartnerIdAndRoles(
    partnerId: number,
    roles: string[],
    skip?: number,
    take?: number,
    includeInactive?: boolean,
  ): Promise<User[]>;

  /**
   * Cuenta usuarios por partnerId y roles (array de roles)
   * Retorna el total de usuarios que pertenezcan al partner y tengan al menos uno de los roles especificados
   * @param includeInactive Si es true, incluye usuarios inactivos/bloqueados. Por defecto true (incluye todos).
   */
  countByPartnerIdAndRoles(
    partnerId: number,
    roles: string[],
    includeInactive?: boolean,
  ): Promise<number>;
}
