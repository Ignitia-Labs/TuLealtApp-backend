import { UserPermission } from '../user-permission.entity';

describe('UserPermission Entity', () => {
  describe('create', () => {
    it('should create a user permission with all required fields', () => {
      const userPermission = UserPermission.create(1, 5, 2);

      expect(userPermission.userId).toBe(1);
      expect(userPermission.permissionId).toBe(5);
      expect(userPermission.assignedBy).toBe(2);
      expect(userPermission.isActive).toBe(true);
      expect(userPermission.id).toBe(0);
      expect(userPermission.assignedAt).toBeInstanceOf(Date);
    });

    it('should create a user permission with optional fields', () => {
      const userPermission = UserPermission.create(1, 5, 2, false, 10);

      expect(userPermission.userId).toBe(1);
      expect(userPermission.permissionId).toBe(5);
      expect(userPermission.assignedBy).toBe(2);
      expect(userPermission.isActive).toBe(false);
      expect(userPermission.id).toBe(10);
    });

    it('should throw error if userId is invalid', () => {
      expect(() => {
        UserPermission.create(0, 5, 2);
      }).toThrow('User ID is required and must be greater than 0');

      expect(() => {
        UserPermission.create(-1, 5, 2);
      }).toThrow('User ID is required and must be greater than 0');
    });

    it('should throw error if permissionId is invalid', () => {
      expect(() => {
        UserPermission.create(1, 0, 2);
      }).toThrow('Permission ID is required and must be greater than 0');

      expect(() => {
        UserPermission.create(1, -1, 2);
      }).toThrow('Permission ID is required and must be greater than 0');
    });

    it('should throw error if assignedBy is invalid', () => {
      expect(() => {
        UserPermission.create(1, 5, 0);
      }).toThrow('AssignedBy user ID is required and must be greater than 0');

      expect(() => {
        UserPermission.create(1, 5, -1);
      }).toThrow('AssignedBy user ID is required and must be greater than 0');
    });
  });

  describe('deactivate', () => {
    it('should deactivate an active user permission', () => {
      const userPermission = UserPermission.create(1, 5, 2);
      expect(userPermission.isActive).toBe(true);

      const deactivated = userPermission.deactivate();
      expect(deactivated.isActive).toBe(false);
      expect(userPermission.isActive).toBe(true); // Original should remain unchanged
    });

    it('should return a new instance', () => {
      const userPermission = UserPermission.create(1, 5, 2);
      const deactivated = userPermission.deactivate();

      expect(deactivated).not.toBe(userPermission);
      expect(deactivated.isActive).toBe(false);
    });

    it('should preserve other properties', () => {
      const userPermission = UserPermission.create(1, 5, 2, true, 10);
      const deactivated = userPermission.deactivate();

      expect(deactivated.id).toBe(userPermission.id);
      expect(deactivated.userId).toBe(userPermission.userId);
      expect(deactivated.permissionId).toBe(userPermission.permissionId);
      expect(deactivated.assignedBy).toBe(userPermission.assignedBy);
      expect(deactivated.assignedAt).toBe(userPermission.assignedAt);
    });
  });

  describe('activate', () => {
    it('should activate an inactive user permission', () => {
      const userPermission = UserPermission.create(1, 5, 2, false);
      expect(userPermission.isActive).toBe(false);

      const activated = userPermission.activate();
      expect(activated.isActive).toBe(true);
      expect(userPermission.isActive).toBe(false); // Original should remain unchanged
    });

    it('should return a new instance', () => {
      const userPermission = UserPermission.create(1, 5, 2, false);
      const activated = userPermission.activate();

      expect(activated).not.toBe(userPermission);
      expect(activated.isActive).toBe(true);
    });

    it('should preserve other properties', () => {
      const userPermission = UserPermission.create(1, 5, 2, false, 10);
      const activated = userPermission.activate();

      expect(activated.id).toBe(userPermission.id);
      expect(activated.userId).toBe(userPermission.userId);
      expect(activated.permissionId).toBe(userPermission.permissionId);
      expect(activated.assignedBy).toBe(userPermission.assignedBy);
      expect(activated.assignedAt).toBe(userPermission.assignedAt);
    });
  });

  describe('isAssignmentActive', () => {
    it('should return true for active assignment', () => {
      const userPermission = UserPermission.create(1, 5, 2);
      expect(userPermission.isAssignmentActive()).toBe(true);
    });

    it('should return false for inactive assignment', () => {
      const userPermission = UserPermission.create(1, 5, 2, false);
      expect(userPermission.isAssignmentActive()).toBe(false);
    });
  });
});
