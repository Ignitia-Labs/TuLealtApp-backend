import { Permission } from '@libs/domain/entities/auth/permission.entity';

describe('Permission Entity', () => {
  describe('create', () => {
    it('should create a permission with all required fields', () => {
      const permission = Permission.create('admin.users.create', 'admin', 'users', 'create');

      expect(permission.code).toBe('admin.users.create');
      expect(permission.module).toBe('admin');
      expect(permission.resource).toBe('users');
      expect(permission.action).toBe('create');
      expect(permission.description).toBeNull();
      expect(permission.isActive).toBe(true);
      expect(permission.id).toBe(0);
      expect(permission.createdAt).toBeInstanceOf(Date);
      expect(permission.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a permission with optional fields', () => {
      const permission = Permission.create(
        'admin.users.create',
        'admin',
        'users',
        'create',
        'Create users',
        false,
        1,
      );

      expect(permission.code).toBe('admin.users.create');
      expect(permission.description).toBe('Create users');
      expect(permission.isActive).toBe(false);
      expect(permission.id).toBe(1);
    });

    it('should create a wildcard permission', () => {
      const permission = Permission.create('admin.*', 'admin', '*', '*');

      expect(permission.code).toBe('admin.*');
      expect(permission.module).toBe('admin');
      expect(permission.resource).toBe('*');
      expect(permission.action).toBe('*');
      expect(permission.isWildcard()).toBe(true);
    });

    it('should throw error if code does not match format', () => {
      expect(() => {
        Permission.create('invalid.code', 'admin', 'users', 'create');
      }).toThrow('Permission code "invalid.code" does not match format "admin.users.create"');
    });

    it('should throw error if code does not match wildcard format', () => {
      expect(() => {
        Permission.create('admin.users.*', 'admin', '*', '*');
      }).toThrow('Permission code "admin.users.*" does not match format "admin.*"');
    });

    it('should throw error if module is missing', () => {
      expect(() => {
        Permission.create('admin.users.create', '', 'users', 'create');
      }).toThrow();
    });
  });

  describe('isWildcard', () => {
    it('should return true for wildcard permission', () => {
      const permission = Permission.create('admin.*', 'admin', '*', '*');
      expect(permission.isWildcard()).toBe(true);
    });

    it('should return false for non-wildcard permission', () => {
      const permission = Permission.create('admin.users.create', 'admin', 'users', 'create');
      expect(permission.isWildcard()).toBe(false);
    });
  });

  describe('matches', () => {
    it('should return true for exact match', () => {
      const permission = Permission.create('admin.users.create', 'admin', 'users', 'create');
      expect(permission.matches('admin.users.create')).toBe(true);
    });

    it('should return false for non-match', () => {
      const permission = Permission.create('admin.users.create', 'admin', 'users', 'create');
      expect(permission.matches('admin.users.view')).toBe(false);
    });

    it('should return true when permission is wildcard and code matches module', () => {
      const permission = Permission.create('admin.*', 'admin', '*', '*');
      expect(permission.matches('admin.users.create')).toBe(true);
      expect(permission.matches('admin.products.view')).toBe(true);
      expect(permission.matches('admin.*')).toBe(true);
    });

    it('should return false when permission is wildcard and code does not match module', () => {
      const permission = Permission.create('admin.*', 'admin', '*', '*');
      expect(permission.matches('partner.products.view')).toBe(false);
    });

    it('should return true when code is wildcard and permission matches module', () => {
      const permission = Permission.create('admin.users.create', 'admin', 'users', 'create');
      expect(permission.matches('admin.*')).toBe(true);
    });

    it('should return false when code is wildcard and permission does not match module', () => {
      const permission = Permission.create('admin.users.create', 'admin', 'users', 'create');
      expect(permission.matches('partner.*')).toBe(false);
    });
  });

  describe('activate', () => {
    it('should activate an inactive permission', () => {
      const permission = Permission.create(
        'admin.users.create',
        'admin',
        'users',
        'create',
        null,
        false,
      );
      expect(permission.isActive).toBe(false);

      const activated = permission.activate();
      expect(activated.isActive).toBe(true);
      expect(permission.isActive).toBe(false); // Original should remain unchanged
    });

    it('should return a new instance', () => {
      const permission = Permission.create(
        'admin.users.create',
        'admin',
        'users',
        'create',
        null,
        false,
      );
      const activated = permission.activate();

      expect(activated).not.toBe(permission);
      expect(activated.isActive).toBe(true);
    });

    it('should preserve other properties', () => {
      const permission = Permission.create(
        'admin.users.create',
        'admin',
        'users',
        'create',
        'Description',
        false,
        1,
      );
      const activated = permission.activate();

      expect(activated.id).toBe(permission.id);
      expect(activated.code).toBe(permission.code);
      expect(activated.module).toBe(permission.module);
      expect(activated.resource).toBe(permission.resource);
      expect(activated.action).toBe(permission.action);
      expect(activated.description).toBe(permission.description);
    });
  });

  describe('deactivate', () => {
    it('should deactivate an active permission', () => {
      const permission = Permission.create('admin.users.create', 'admin', 'users', 'create');
      expect(permission.isActive).toBe(true);

      const deactivated = permission.deactivate();
      expect(deactivated.isActive).toBe(false);
      expect(permission.isActive).toBe(true); // Original should remain unchanged
    });

    it('should return a new instance', () => {
      const permission = Permission.create('admin.users.create', 'admin', 'users', 'create');
      const deactivated = permission.deactivate();

      expect(deactivated).not.toBe(permission);
      expect(deactivated.isActive).toBe(false);
    });

    it('should preserve other properties', () => {
      const permission = Permission.create(
        'admin.users.create',
        'admin',
        'users',
        'create',
        'Description',
        true,
        1,
      );
      const deactivated = permission.deactivate();

      expect(deactivated.id).toBe(permission.id);
      expect(deactivated.code).toBe(permission.code);
      expect(deactivated.module).toBe(permission.module);
      expect(deactivated.resource).toBe(permission.resource);
      expect(deactivated.action).toBe(permission.action);
      expect(deactivated.description).toBe(permission.description);
    });
  });

  describe('updateDescription', () => {
    it('should update description', () => {
      const permission = Permission.create('admin.users.create', 'admin', 'users', 'create');
      const updated = permission.updateDescription('New description');

      expect(updated.description).toBe('New description');
      expect(permission.description).toBeNull(); // Original should remain unchanged
    });

    it('should return a new instance', () => {
      const permission = Permission.create('admin.users.create', 'admin', 'users', 'create');
      const updated = permission.updateDescription('New description');

      expect(updated).not.toBe(permission);
    });

    it('should preserve other properties', () => {
      const permission = Permission.create(
        'admin.users.create',
        'admin',
        'users',
        'create',
        'Old description',
        true,
        1,
      );
      const updated = permission.updateDescription('New description');

      expect(updated.id).toBe(permission.id);
      expect(updated.code).toBe(permission.code);
      expect(updated.module).toBe(permission.module);
      expect(updated.resource).toBe(permission.resource);
      expect(updated.action).toBe(permission.action);
      expect(updated.isActive).toBe(permission.isActive);
    });
  });

  describe('isPermissionActive', () => {
    it('should return true for active permission', () => {
      const permission = Permission.create('admin.users.create', 'admin', 'users', 'create');
      expect(permission.isPermissionActive()).toBe(true);
    });

    it('should return false for inactive permission', () => {
      const permission = Permission.create(
        'admin.users.create',
        'admin',
        'users',
        'create',
        null,
        false,
      );
      expect(permission.isPermissionActive()).toBe(false);
    });
  });
});
