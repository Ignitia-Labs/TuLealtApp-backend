import { Permission } from '../entities/permission.entity';

/**
 * Interfaz del repositorio de permisos
 * Define el contrato que debe cumplir cualquier implementación
 * La implementación concreta estará en la capa de infraestructura
 */
export interface IPermissionRepository {
  /**
   * Busca un permiso por su ID
   */
  findById(id: number): Promise<Permission | null>;

  /**
   * Busca un permiso por su código único
   */
  findByCode(code: string): Promise<Permission | null>;

  /**
   * Busca todos los permisos (con paginación opcional)
   */
  findAll(skip?: number, take?: number): Promise<Permission[]>;

  /**
   * Busca permisos por módulo
   */
  findByModule(module: string): Promise<Permission[]>;

  /**
   * Busca permisos por módulo y recurso
   */
  findByModuleAndResource(module: string, resource: string): Promise<Permission[]>;

  /**
   * Guarda un nuevo permiso
   */
  save(permission: Permission): Promise<Permission>;

  /**
   * Actualiza un permiso existente
   */
  update(permission: Permission): Promise<Permission>;

  /**
   * Elimina un permiso por su ID
   */
  delete(id: number): Promise<void>;

  /**
   * Valida un array de códigos de permisos
   * Retorna un objeto con arrays de permisos válidos e inválidos
   */
  validatePermissions(permissionCodes: string[]): Promise<{ valid: string[]; invalid: string[] }>;

  /**
   * Busca permisos activos
   */
  findActive(skip?: number, take?: number): Promise<Permission[]>;

  /**
   * Cuenta el total de permisos
   */
  count(): Promise<number>;

  /**
   * Cuenta permisos por módulo
   */
  countByModule(module: string): Promise<number>;
}
