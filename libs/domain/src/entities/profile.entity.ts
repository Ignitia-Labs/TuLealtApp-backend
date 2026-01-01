/**
 * Entidad de dominio Profile
 * Representa un perfil de acceso con permisos configurables
 * No depende de frameworks ni librerías externas
 */
export class Profile {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly description: string | null,
    public readonly partnerId: number | null, // null = perfil global del sistema
    public readonly permissions: string[], // ["module.resource.action", ...]
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear un nuevo perfil
   * El ID es opcional porque será generado automáticamente por la base de datos
   */
  static create(
    name: string,
    permissions: string[],
    description: string | null = null,
    partnerId: number | null = null,
    isActive: boolean = true,
    id?: number,
  ): Profile {
    const now = new Date();
    return new Profile(
      id || 0,
      name,
      description,
      partnerId,
      permissions,
      isActive,
      now,
      now,
    );
  }

  /**
   * Método de dominio para verificar si el perfil tiene un permiso específico
   * Soporta wildcards (ej: "admin.*" coincide con "admin.users.create")
   */
  hasPermission(permission: string): boolean {
    // Verificar permiso exacto
    if (this.permissions.includes(permission)) {
      return true;
    }

    // Verificar wildcards
    for (const profilePermission of this.permissions) {
      if (this.matchesWildcard(profilePermission, permission)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Método de dominio para verificar si el perfil puede acceder a un módulo/recurso/acción
   * Construye el permiso como "module.resource.action" y verifica con hasPermission
   */
  canAccess(module: string, resource: string, action: string): boolean {
    const permission = `${module}.${resource}.${action}`;
    return this.hasPermission(permission);
  }

  /**
   * Método de dominio para agregar un permiso al perfil
   * Retorna una nueva instancia del perfil con el permiso agregado
   */
  addPermission(permission: string): Profile {
    if (this.permissions.includes(permission)) {
      return this; // Ya existe, retornar sin cambios
    }
    return new Profile(
      this.id,
      this.name,
      this.description,
      this.partnerId,
      [...this.permissions, permission],
      this.isActive,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para remover un permiso del perfil
   * Retorna una nueva instancia del perfil sin el permiso
   */
  removePermission(permission: string): Profile {
    const filteredPermissions = this.permissions.filter((p) => p !== permission);
    if (filteredPermissions.length === this.permissions.length) {
      return this; // No existía, retornar sin cambios
    }
    return new Profile(
      this.id,
      this.name,
      this.description,
      this.partnerId,
      filteredPermissions,
      this.isActive,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para desactivar el perfil
   * Retorna una nueva instancia del perfil desactivado
   */
  deactivate(): Profile {
    return new Profile(
      this.id,
      this.name,
      this.description,
      this.partnerId,
      this.permissions,
      false,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para activar el perfil
   * Retorna una nueva instancia del perfil activado
   */
  activate(): Profile {
    return new Profile(
      this.id,
      this.name,
      this.description,
      this.partnerId,
      this.permissions,
      true,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para verificar si el perfil está activo
   */
  isProfileActive(): boolean {
    return this.isActive;
  }

  /**
   * Método de dominio para verificar si es un perfil global (partnerId = null)
   */
  isGlobal(): boolean {
    return this.partnerId === null;
  }

  /**
   * Método privado para verificar coincidencia con wildcards
   * Ejemplos:
   * - "admin.*" coincide con "admin.users.create"
   * - "admin.users.*" coincide con "admin.users.create"
   * - "admin.*.create" NO coincide (wildcard solo al final)
   */
  private matchesWildcard(pattern: string, permission: string): boolean {
    if (!pattern.includes('*')) {
      return false;
    }

    // Solo permitir wildcard al final
    if (!pattern.endsWith('*')) {
      return false;
    }

    const prefix = pattern.slice(0, -1); // Remover el '*'
    return permission.startsWith(prefix);
  }
}

