import { Profile } from '@libs/domain/entities/auth/profile.entity';

describe('Profile Entity', () => {
  describe('create', () => {
    it('should create a profile with all required fields', () => {
      const profile = Profile.create('Test Profile', ['admin.users.view']);

      expect(profile.name).toBe('Test Profile');
      expect(profile.permissions).toEqual(['admin.users.view']);
      expect(profile.description).toBeNull();
      expect(profile.partnerId).toBeNull();
      expect(profile.isActive).toBe(true);
      expect(profile.id).toBe(0);
      expect(profile.createdAt).toBeInstanceOf(Date);
      expect(profile.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a profile with optional fields', () => {
      const profile = Profile.create(
        'Test Profile',
        ['admin.users.view', 'admin.users.create'],
        'Test description',
        1,
        false,
        5,
      );

      expect(profile.name).toBe('Test Profile');
      expect(profile.permissions).toEqual(['admin.users.view', 'admin.users.create']);
      expect(profile.description).toBe('Test description');
      expect(profile.partnerId).toBe(1);
      expect(profile.isActive).toBe(false);
      expect(profile.id).toBe(5);
    });

    it('should create a global profile when partnerId is null', () => {
      const profile = Profile.create('Global Profile', ['admin.*']);
      expect(profile.isGlobal()).toBe(true);
    });

    it('should create a partner-specific profile when partnerId is provided', () => {
      const profile = Profile.create('Partner Profile', ['partner.products.view'], null, 1);
      expect(profile.isGlobal()).toBe(false);
      expect(profile.partnerId).toBe(1);
    });
  });

  describe('hasPermission', () => {
    it('should return true for exact permission match', () => {
      const profile = Profile.create('Test', ['admin.users.view']);
      expect(profile.hasPermission('admin.users.view')).toBe(true);
    });

    it('should return false for non-existent permission', () => {
      const profile = Profile.create('Test', ['admin.users.view']);
      expect(profile.hasPermission('admin.users.create')).toBe(false);
    });

    it('should return true for wildcard permission at end', () => {
      const profile = Profile.create('Test', ['admin.*']);
      expect(profile.hasPermission('admin.users.view')).toBe(true);
      expect(profile.hasPermission('admin.users.create')).toBe(true);
      expect(profile.hasPermission('admin.products.view')).toBe(true);
    });

    it('should return false for wildcard permission not at end', () => {
      const profile = Profile.create('Test', ['admin.*.create']);
      expect(profile.hasPermission('admin.users.create')).toBe(false);
    });

    it('should return true for nested wildcard permission', () => {
      const profile = Profile.create('Test', ['admin.users.*']);
      expect(profile.hasPermission('admin.users.view')).toBe(true);
      expect(profile.hasPermission('admin.users.create')).toBe(true);
      expect(profile.hasPermission('admin.users.delete')).toBe(true);
    });

    it('should return false for permission that does not match wildcard prefix', () => {
      const profile = Profile.create('Test', ['admin.*']);
      expect(profile.hasPermission('partner.products.view')).toBe(false);
    });

    it('should handle multiple permissions correctly', () => {
      const profile = Profile.create('Test', [
        'admin.users.view',
        'admin.users.create',
        'partner.products.*',
      ]);
      expect(profile.hasPermission('admin.users.view')).toBe(true);
      expect(profile.hasPermission('admin.users.create')).toBe(true);
      expect(profile.hasPermission('partner.products.view')).toBe(true);
      expect(profile.hasPermission('admin.products.view')).toBe(false);
    });
  });

  describe('canAccess', () => {
    it('should return true when permission exists', () => {
      const profile = Profile.create('Test', ['admin.users.view']);
      expect(profile.canAccess('admin', 'users', 'view')).toBe(true);
    });

    it('should return false when permission does not exist', () => {
      const profile = Profile.create('Test', ['admin.users.view']);
      expect(profile.canAccess('admin', 'users', 'create')).toBe(false);
    });

    it('should construct permission correctly', () => {
      const profile = Profile.create('Test', ['admin.users.create']);
      expect(profile.canAccess('admin', 'users', 'create')).toBe(true);
      expect(profile.canAccess('admin', 'products', 'view')).toBe(false);
    });

    it('should work with wildcard permissions', () => {
      const profile = Profile.create('Test', ['admin.*']);
      expect(profile.canAccess('admin', 'users', 'view')).toBe(true);
      expect(profile.canAccess('admin', 'products', 'create')).toBe(true);
      expect(profile.canAccess('partner', 'products', 'view')).toBe(false);
    });
  });

  describe('addPermission', () => {
    it('should add a new permission', () => {
      const profile = Profile.create('Test', ['admin.users.view']);
      const updated = profile.addPermission('admin.users.create');

      expect(updated.permissions).toContain('admin.users.view');
      expect(updated.permissions).toContain('admin.users.create');
      expect(updated.permissions.length).toBe(2);
    });

    it('should not add duplicate permission', () => {
      const profile = Profile.create('Test', ['admin.users.view']);
      const updated = profile.addPermission('admin.users.view');

      expect(updated.permissions.length).toBe(1);
      expect(updated.permissions).toEqual(['admin.users.view']);
      expect(updated).toBe(profile); // Should return same instance
    });

    it('should return a new instance with updated timestamp', () => {
      const profile = Profile.create('Test', ['admin.users.view']);
      const beforeTime = profile.updatedAt;

      // Wait a bit to ensure timestamp difference
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const updated = profile.addPermission('admin.users.create');
          expect(updated).not.toBe(profile);
          expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
          resolve();
        }, 10);
      });
    });

    it('should preserve other profile properties', () => {
      const profile = Profile.create('Test', ['admin.users.view'], 'Description', 1);
      const updated = profile.addPermission('admin.users.create');

      expect(updated.id).toBe(profile.id);
      expect(updated.name).toBe(profile.name);
      expect(updated.description).toBe(profile.description);
      expect(updated.partnerId).toBe(profile.partnerId);
      expect(updated.isActive).toBe(profile.isActive);
    });
  });

  describe('removePermission', () => {
    it('should remove an existing permission', () => {
      const profile = Profile.create('Test', ['admin.users.view', 'admin.users.create']);
      const updated = profile.removePermission('admin.users.view');

      expect(updated.permissions).not.toContain('admin.users.view');
      expect(updated.permissions).toContain('admin.users.create');
      expect(updated.permissions.length).toBe(1);
    });

    it('should not remove non-existent permission', () => {
      const profile = Profile.create('Test', ['admin.users.view']);
      const updated = profile.removePermission('admin.users.create');

      expect(updated.permissions).toEqual(['admin.users.view']);
      expect(updated).toBe(profile); // Should return same instance
    });

    it('should return a new instance with updated timestamp', () => {
      const profile = Profile.create('Test', ['admin.users.view', 'admin.users.create']);
      const beforeTime = profile.updatedAt;

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const updated = profile.removePermission('admin.users.view');
          expect(updated).not.toBe(profile);
          expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
          resolve();
        }, 10);
      });
    });

    it('should preserve other profile properties', () => {
      const profile = Profile.create('Test', ['admin.users.view'], 'Description', 1);
      const updated = profile.removePermission('admin.users.view');

      expect(updated.id).toBe(profile.id);
      expect(updated.name).toBe(profile.name);
      expect(updated.description).toBe(profile.description);
      expect(updated.partnerId).toBe(profile.partnerId);
      expect(updated.isActive).toBe(profile.isActive);
    });
  });

  describe('activate', () => {
    it('should activate an inactive profile', () => {
      const profile = Profile.create('Test', ['admin.users.view'], null, null, false);
      expect(profile.isActive).toBe(false);

      const activated = profile.activate();
      expect(activated.isActive).toBe(true);
      expect(profile.isActive).toBe(false); // Original should remain unchanged
    });

    it('should return a new instance', () => {
      const profile = Profile.create('Test', ['admin.users.view'], null, null, false);
      const activated = profile.activate();

      expect(activated).not.toBe(profile);
      expect(activated.isActive).toBe(true);
    });

    it('should preserve other properties', () => {
      const profile = Profile.create('Test', ['admin.users.view'], 'Description', 1, false);
      const activated = profile.activate();

      expect(activated.id).toBe(profile.id);
      expect(activated.name).toBe(profile.name);
      expect(activated.permissions).toEqual(profile.permissions);
      expect(activated.description).toBe(profile.description);
      expect(activated.partnerId).toBe(profile.partnerId);
    });
  });

  describe('deactivate', () => {
    it('should deactivate an active profile', () => {
      const profile = Profile.create('Test', ['admin.users.view']);
      expect(profile.isActive).toBe(true);

      const deactivated = profile.deactivate();
      expect(deactivated.isActive).toBe(false);
      expect(profile.isActive).toBe(true); // Original should remain unchanged
    });

    it('should return a new instance', () => {
      const profile = Profile.create('Test', ['admin.users.view']);
      const deactivated = profile.deactivate();

      expect(deactivated).not.toBe(profile);
      expect(deactivated.isActive).toBe(false);
    });

    it('should preserve other properties', () => {
      const profile = Profile.create('Test', ['admin.users.view'], 'Description', 1);
      const deactivated = profile.deactivate();

      expect(deactivated.id).toBe(profile.id);
      expect(deactivated.name).toBe(profile.name);
      expect(deactivated.permissions).toEqual(profile.permissions);
      expect(deactivated.description).toBe(profile.description);
      expect(deactivated.partnerId).toBe(profile.partnerId);
    });
  });

  describe('isProfileActive', () => {
    it('should return true for active profile', () => {
      const profile = Profile.create('Test', ['admin.users.view']);
      expect(profile.isProfileActive()).toBe(true);
    });

    it('should return false for inactive profile', () => {
      const profile = Profile.create('Test', ['admin.users.view'], null, null, false);
      expect(profile.isProfileActive()).toBe(false);
    });
  });

  describe('isGlobal', () => {
    it('should return true for global profile (partnerId is null)', () => {
      const profile = Profile.create('Test', ['admin.users.view']);
      expect(profile.isGlobal()).toBe(true);
    });

    it('should return false for partner-specific profile', () => {
      const profile = Profile.create('Test', ['admin.users.view'], null, 1);
      expect(profile.isGlobal()).toBe(false);
    });
  });
});
