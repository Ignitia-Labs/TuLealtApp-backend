import { ProfilePermission } from '../profile-permission.entity';

describe('ProfilePermission Entity', () => {
  describe('create', () => {
    it('should create a profile permission with all required fields', () => {
      const profilePermission = ProfilePermission.create(1, 2);

      expect(profilePermission.profileId).toBe(1);
      expect(profilePermission.permissionId).toBe(2);
      expect(profilePermission.createdAt).toBeInstanceOf(Date);
      expect(profilePermission.updatedAt).toBeInstanceOf(Date);
      expect(profilePermission.id).toBe(0);
    });

    it('should create a profile permission with optional id', () => {
      const profilePermission = ProfilePermission.create(1, 2, 5);

      expect(profilePermission.id).toBe(5);
      expect(profilePermission.profileId).toBe(1);
      expect(profilePermission.permissionId).toBe(2);
    });

    it('should throw error if profileId is invalid', () => {
      expect(() => ProfilePermission.create(0, 2)).toThrow(
        'Profile ID is required and must be greater than 0',
      );
      expect(() => ProfilePermission.create(-1, 2)).toThrow(
        'Profile ID is required and must be greater than 0',
      );
    });

    it('should throw error if permissionId is invalid', () => {
      expect(() => ProfilePermission.create(1, 0)).toThrow(
        'Permission ID is required and must be greater than 0',
      );
      expect(() => ProfilePermission.create(1, -1)).toThrow(
        'Permission ID is required and must be greater than 0',
      );
    });
  });
});
