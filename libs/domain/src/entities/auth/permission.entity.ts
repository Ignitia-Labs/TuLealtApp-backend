/**
 * Entidad de dominio Permission
 * Representa un permiso en el catálogo centralizado del sistema
 * No depende de frameworks ni librerías externas
 */
export class Permission {
  constructor(
    public readonly id: number,
    public readonly code: string, // "admin.users.create"
    public readonly module: string, // "admin"
    public readonly resource: string, // "users"
    public readonly action: string, // "create" o "*"
    public readonly description: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear un nuevo permiso
   * El ID es opcional porque será generado automáticamente por la base de datos
   */
  static create(
    code: string,
    module: string,
    resource: string,
    action: string,
    description: string | null = null,
    isActive: boolean = true,
    id?: number,
  ): Permission {
    // Validar formato del código
    if (!code || typeof code !== 'string') {
      throw new Error('Permission code is required and must be a string');
    }

    // Validar que el código coincida con module.resource.action o module.*
    const expectedCode = action === '*' ? `${module}.*` : `${module}.${resource}.${action}`;
    if (code !== expectedCode) {
      throw new Error(`Permission code "${code}" does not match format "${expectedCode}"`);
    }

    // Validar formato básico
    if (action !== '*' && (!module || !resource || !action)) {
      throw new Error(
        'Permission module, resource, and action are required (unless action is "*")',
      );
    }

    if (action === '*' && !module) {
      throw new Error('Permission module is required even when action is "*"');
    }

    const now = new Date();
    return new Permission(id || 0, code, module, resource, action, description, isActive, now, now);
  }

  /**
   * Verifica si el permiso es un wildcard (action = "*")
   */
  isWildcard(): boolean {
    return this.action === '*';
  }

  /**
   * Verifica si este permiso coincide con otro código de permiso
   * Soporta wildcards (ej: "admin.*" coincide con "admin.users.create")
   */
  matches(permissionCode: string): boolean {
    // Verificar permiso exacto
    if (this.code === permissionCode) {
      return true;
    }

    // Si este permiso es wildcard, verificar si el código comienza con el módulo
    if (this.isWildcard()) {
      return permissionCode.startsWith(`${this.module}.`);
    }

    // Si el código a verificar es wildcard, verificar si este permiso pertenece al módulo
    if (permissionCode.endsWith('.*')) {
      const modulePrefix = permissionCode.slice(0, -2); // Remover ".*"
      return this.code.startsWith(`${modulePrefix}.`);
    }

    return false;
  }

  /**
   * Método de dominio para desactivar el permiso
   * Retorna una nueva instancia del permiso desactivado
   */
  deactivate(): Permission {
    return new Permission(
      this.id,
      this.code,
      this.module,
      this.resource,
      this.action,
      this.description,
      false,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para activar el permiso
   * Retorna una nueva instancia del permiso activado
   */
  activate(): Permission {
    return new Permission(
      this.id,
      this.code,
      this.module,
      this.resource,
      this.action,
      this.description,
      true,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para actualizar la descripción
   * Retorna una nueva instancia con la descripción actualizada
   */
  updateDescription(description: string | null): Permission {
    return new Permission(
      this.id,
      this.code,
      this.module,
      this.resource,
      this.action,
      description,
      this.isActive,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para verificar si el permiso está activo
   */
  isPermissionActive(): boolean {
    return this.isActive;
  }
}
