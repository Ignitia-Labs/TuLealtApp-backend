import { UserProfile } from './user-profile.entity';

describe('UserProfile Entity', () => {
  describe('create', () => {
    it('should create a user profile with all required fields', () => {
      const userProfile = UserProfile.create(1, 2, 3);

      expect(userProfile.userId).toBe(1);
      expect(userProfile.profileId).toBe(2);
      expect(userProfile.assignedBy).toBe(3);
      expect(userProfile.isActive).toBe(true);
      expect(userProfile.id).toBe(0);
      expect(userProfile.assignedAt).toBeInstanceOf(Date);
    });

    it('should create a user profile with optional fields', () => {
      const userProfile = UserProfile.create(1, 2, 3, false, 5);

      expect(userProfile.userId).toBe(1);
      expect(userProfile.profileId).toBe(2);
      expect(userProfile.assignedBy).toBe(3);
      expect(userProfile.isActive).toBe(false);
      expect(userProfile.id).toBe(5);
    });

    it('should default to active when isActive is not provided', () => {
      const userProfile = UserProfile.create(1, 2, 3);
      expect(userProfile.isActive).toBe(true);
    });
  });

  describe('activate', () => {
    it('should activate an inactive user profile', () => {
      const userProfile = UserProfile.create(1, 2, 3, false);
      expect(userProfile.isActive).toBe(false);

      const activated = userProfile.activate();
      expect(activated.isActive).toBe(true);
      expect(userProfile.isActive).toBe(false); // Original should remain unchanged
    });

    it('should return a new instance', () => {
      const userProfile = UserProfile.create(1, 2, 3, false);
      const activated = userProfile.activate();

      expect(activated).not.toBe(userProfile);
      expect(activated.isActive).toBe(true);
    });

    it('should preserve other properties', () => {
      const userProfile = UserProfile.create(1, 2, 3, false, 5);
      const activated = userProfile.activate();

      expect(activated.id).toBe(userProfile.id);
      expect(activated.userId).toBe(userProfile.userId);
      expect(activated.profileId).toBe(userProfile.profileId);
      expect(activated.assignedBy).toBe(userProfile.assignedBy);
      expect(activated.assignedAt).toBe(userProfile.assignedAt);
    });
  });

  describe('deactivate', () => {
    it('should deactivate an active user profile', () => {
      const userProfile = UserProfile.create(1, 2, 3);
      expect(userProfile.isActive).toBe(true);

      const deactivated = userProfile.deactivate();
      expect(deactivated.isActive).toBe(false);
      expect(userProfile.isActive).toBe(true); // Original should remain unchanged
    });

    it('should return a new instance', () => {
      const userProfile = UserProfile.create(1, 2, 3);
      const deactivated = userProfile.deactivate();

      expect(deactivated).not.toBe(userProfile);
      expect(deactivated.isActive).toBe(false);
    });

    it('should preserve other properties', () => {
      const userProfile = UserProfile.create(1, 2, 3, true, 5);
      const deactivated = userProfile.deactivate();

      expect(deactivated.id).toBe(userProfile.id);
      expect(deactivated.userId).toBe(userProfile.userId);
      expect(deactivated.profileId).toBe(userProfile.profileId);
      expect(deactivated.assignedBy).toBe(userProfile.assignedBy);
      expect(deactivated.assignedAt).toBe(userProfile.assignedAt);
    });
  });

  describe('isAssignmentActive', () => {
    it('should return true for active assignment', () => {
      const userProfile = UserProfile.create(1, 2, 3);
      expect(userProfile.isAssignmentActive()).toBe(true);
    });

    it('should return false for inactive assignment', () => {
      const userProfile = UserProfile.create(1, 2, 3, false);
      expect(userProfile.isAssignmentActive()).toBe(false);
    });
  });
});

