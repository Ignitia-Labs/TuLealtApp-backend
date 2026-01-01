import { Test, TestingModule } from '@nestjs/testing';
import { PermissionService } from './permission.service';
import { IUserProfileRepository, IProfileRepository, Profile, UserProfile } from '@libs/domain';

describe('PermissionService', () => {
  let service: PermissionService;
  let userProfileRepository: jest.Mocked<IUserProfileRepository>;
  let profileRepository: jest.Mocked<IProfileRepository>;

  beforeEach(async () => {
    const mockUserProfileRepository = {
      findActiveByUserId: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
      findByProfileId: jest.fn(),
      findByUserIdAndProfileId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockProfileRepository = {
      findById: jest.fn(),
      findByPartnerId: jest.fn(),
      findGlobalProfiles: jest.fn(),
      findByName: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        {
          provide: 'IUserProfileRepository',
          useValue: mockUserProfileRepository,
        },
        {
          provide: 'IProfileRepository',
          useValue: mockProfileRepository,
        },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
    userProfileRepository = module.get('IUserProfileRepository');
    profileRepository = module.get('IProfileRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validatePermissionFormat', () => {
    it('should validate correct permission format', () => {
      expect(service.validatePermissionFormat('admin.users.view')).toBe(true);
      expect(service.validatePermissionFormat('partner.products.create')).toBe(true);
      expect(service.validatePermissionFormat('customer.memberships.view')).toBe(true);
    });

    it('should validate wildcard permission format', () => {
      expect(service.validatePermissionFormat('admin.*')).toBe(true);
      expect(service.validatePermissionFormat('partner.products.*')).toBe(true);
    });

    it('should reject invalid permission formats', () => {
      expect(service.validatePermissionFormat('admin')).toBe(false);
      expect(service.validatePermissionFormat('admin.users')).toBe(false);
      expect(service.validatePermissionFormat('admin.users.view.create')).toBe(false);
      expect(service.validatePermissionFormat('')).toBe(false);
      expect(service.validatePermissionFormat('admin..view')).toBe(false);
      expect(service.validatePermissionFormat('.users.view')).toBe(false);
    });

    it('should reject wildcard not at end', () => {
      expect(service.validatePermissionFormat('admin.*.view')).toBe(false);
      expect(service.validatePermissionFormat('*.users.view')).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(service.validatePermissionFormat(null as any)).toBe(false);
      expect(service.validatePermissionFormat(undefined as any)).toBe(false);
    });
  });

  describe('parsePermission', () => {
    it('should parse valid permission correctly', () => {
      const result = service.parsePermission('admin.users.view');
      expect(result).toEqual({
        module: 'admin',
        resource: 'users',
        action: 'view',
      });
    });

    it('should parse wildcard permission correctly', () => {
      const result = service.parsePermission('admin.*');
      expect(result).toEqual({
        module: 'admin',
        resource: '*',
        action: '*',
      });
    });

    it('should return null for invalid permission', () => {
      expect(service.parsePermission('admin')).toBeNull();
      expect(service.parsePermission('admin.users')).toBeNull();
      expect(service.parsePermission('')).toBeNull();
    });
  });

  describe('getUserPermissions', () => {
    it('should return consolidated permissions from active profiles', async () => {
      const userProfiles = [
        UserProfile.create(1, 1, 1, true),
        UserProfile.create(1, 2, 1, true),
      ];

      const profile1 = Profile.create('Profile 1', ['admin.users.view', 'admin.users.create']);
      const profile2 = Profile.create('Profile 2', ['admin.products.view', 'partner.orders.view']);

      userProfileRepository.findActiveByUserId.mockResolvedValue(userProfiles);
      profileRepository.findById
        .mockResolvedValueOnce(profile1)
        .mockResolvedValueOnce(profile2);

      const permissions = await service.getUserPermissions(1);

      expect(permissions).toHaveLength(4);
      expect(permissions).toContain('admin.users.view');
      expect(permissions).toContain('admin.users.create');
      expect(permissions).toContain('admin.products.view');
      expect(permissions).toContain('partner.orders.view');
    });

    it('should remove duplicate permissions', async () => {
      const userProfiles = [
        UserProfile.create(1, 1, 1, true),
        UserProfile.create(1, 2, 1, true),
      ];

      const profile1 = Profile.create('Profile 1', ['admin.users.view']);
      const profile2 = Profile.create('Profile 2', ['admin.users.view', 'admin.products.view']);

      userProfileRepository.findActiveByUserId.mockResolvedValue(userProfiles);
      profileRepository.findById
        .mockResolvedValueOnce(profile1)
        .mockResolvedValueOnce(profile2);

      const permissions = await service.getUserPermissions(1);

      expect(permissions).toHaveLength(2);
      expect(permissions).toContain('admin.users.view');
      expect(permissions).toContain('admin.products.view');
    });

    it('should only include permissions from active profiles', async () => {
      const userProfiles = [
        UserProfile.create(1, 1, 1, true),
        UserProfile.create(1, 2, 1, true),
      ];

      const activeProfile = Profile.create('Active Profile', ['admin.users.view']);
      const inactiveProfile = Profile.create('Inactive Profile', ['admin.products.view'], null, null, false);

      userProfileRepository.findActiveByUserId.mockResolvedValue(userProfiles);
      profileRepository.findById
        .mockResolvedValueOnce(activeProfile)
        .mockResolvedValueOnce(inactiveProfile);

      const permissions = await service.getUserPermissions(1);

      expect(permissions).toHaveLength(1);
      expect(permissions).toContain('admin.users.view');
      expect(permissions).not.toContain('admin.products.view');
    });

    it('should return empty array when user has no active profiles', async () => {
      userProfileRepository.findActiveByUserId.mockResolvedValue([]);

      const permissions = await service.getUserPermissions(1);

      expect(permissions).toEqual([]);
    });
  });

  describe('userHasPermission', () => {
    it('should return true when user has exact permission', async () => {
      const userProfiles = [UserProfile.create(1, 1, 1, true)];
      const profile = Profile.create('Profile', ['admin.users.view']);

      userProfileRepository.findActiveByUserId.mockResolvedValue(userProfiles);
      profileRepository.findById.mockResolvedValue(profile);

      const result = await service.userHasPermission(1, 'admin.users.view');

      expect(result).toBe(true);
    });

    it('should return false when user does not have permission', async () => {
      const userProfiles = [UserProfile.create(1, 1, 1, true)];
      const profile = Profile.create('Profile', ['admin.users.view']);

      userProfileRepository.findActiveByUserId.mockResolvedValue(userProfiles);
      profileRepository.findById.mockResolvedValue(profile);

      const result = await service.userHasPermission(1, 'admin.users.create');

      expect(result).toBe(false);
    });

    it('should return true when user has wildcard permission', async () => {
      const userProfiles = [UserProfile.create(1, 1, 1, true)];
      const profile = Profile.create('Profile', ['admin.*']);

      userProfileRepository.findActiveByUserId.mockResolvedValue(userProfiles);
      profileRepository.findById.mockResolvedValue(profile);

      const result = await service.userHasPermission(1, 'admin.users.view');

      expect(result).toBe(true);
    });

    it('should return false when wildcard does not match', async () => {
      const userProfiles = [UserProfile.create(1, 1, 1, true)];
      const profile = Profile.create('Profile', ['admin.*']);

      userProfileRepository.findActiveByUserId.mockResolvedValue(userProfiles);
      profileRepository.findById.mockResolvedValue(profile);

      const result = await service.userHasPermission(1, 'partner.products.view');

      expect(result).toBe(false);
    });

    it('should consolidate permissions from multiple profiles', async () => {
      const userProfiles = [
        UserProfile.create(1, 1, 1, true),
        UserProfile.create(1, 2, 1, true),
      ];

      const profile1 = Profile.create('Profile 1', ['admin.users.view']);
      const profile2 = Profile.create('Profile 2', ['admin.users.create']);

      userProfileRepository.findActiveByUserId.mockResolvedValue(userProfiles);
      profileRepository.findById
        .mockResolvedValueOnce(profile1)
        .mockResolvedValueOnce(profile2);

      const result1 = await service.userHasPermission(1, 'admin.users.view');
      const result2 = await service.userHasPermission(1, 'admin.users.create');

      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });
  });

  describe('userCanAccess', () => {
    it('should return true when user can access resource', async () => {
      const userProfiles = [UserProfile.create(1, 1, 1, true)];
      const profile = Profile.create('Profile', ['admin.users.view']);

      userProfileRepository.findActiveByUserId.mockResolvedValue(userProfiles);
      profileRepository.findById.mockResolvedValue(profile);

      const result = await service.userCanAccess(1, 'admin', 'users', 'view');

      expect(result).toBe(true);
    });

    it('should return false when user cannot access resource', async () => {
      const userProfiles = [UserProfile.create(1, 1, 1, true)];
      const profile = Profile.create('Profile', ['admin.users.view']);

      userProfileRepository.findActiveByUserId.mockResolvedValue(userProfiles);
      profileRepository.findById.mockResolvedValue(profile);

      const result = await service.userCanAccess(1, 'admin', 'users', 'create');

      expect(result).toBe(false);
    });

    it('should construct permission correctly', async () => {
      const userProfiles = [UserProfile.create(1, 1, 1, true)];
      const profile = Profile.create('Profile', ['admin.users.create']);

      userProfileRepository.findActiveByUserId.mockResolvedValue(userProfiles);
      profileRepository.findById.mockResolvedValue(profile);

      const result = await service.userCanAccess(1, 'admin', 'users', 'create');

      expect(result).toBe(true);
    });

    it('should work with wildcard permissions', async () => {
      const userProfiles = [UserProfile.create(1, 1, 1, true)];
      const profile = Profile.create('Profile', ['admin.*']);

      userProfileRepository.findActiveByUserId.mockResolvedValue(userProfiles);
      profileRepository.findById.mockResolvedValue(profile);

      const result = await service.userCanAccess(1, 'admin', 'users', 'view');

      expect(result).toBe(true);
    });
  });
});

