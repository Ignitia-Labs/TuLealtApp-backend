import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetUserProfilesHandler } from './get-user-profiles.handler';
import { GetUserProfilesRequest } from './get-user-profiles.request';
import {
  IUserProfileRepository,
  IProfileRepository,
  IUserRepository,
  UserProfile,
  Profile,
  User,
} from '@libs/domain';

describe('GetUserProfilesHandler', () => {
  let handler: GetUserProfilesHandler;
  let userProfileRepository: jest.Mocked<IUserProfileRepository>;
  let profileRepository: jest.Mocked<IProfileRepository>;
  let userRepository: jest.Mocked<IUserRepository>;

  beforeEach(async () => {
    const mockUserProfileRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByProfileId: jest.fn(),
      findByUserIdAndProfileId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findActiveByUserId: jest.fn(),
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

    const mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      findByRoles: jest.fn(),
      countByRoles: jest.fn(),
      findByPartnerIdAndRoles: jest.fn(),
      countByPartnerIdAndRoles: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserProfilesHandler,
        {
          provide: 'IUserProfileRepository',
          useValue: mockUserProfileRepository,
        },
        {
          provide: 'IProfileRepository',
          useValue: mockProfileRepository,
        },
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    handler = module.get<GetUserProfilesHandler>(GetUserProfilesHandler);
    userProfileRepository = module.get('IUserProfileRepository');
    profileRepository = module.get('IProfileRepository');
    userRepository = module.get('IUserRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return user profiles successfully', async () => {
      const request = new GetUserProfilesRequest();
      request.userId = 1;

      const user = User.create(
        'user@example.com',
        'Test User',
        'Test',
        'User',
        '+1234567890',
        'hash',
        ['PARTNER_STAFF'],
        null,
        1,
      );

      const assignments = [
        UserProfile.create(1, 1, 2, true, 1),
        UserProfile.create(1, 2, 2, false, 2),
      ];

      const profile1 = Profile.create('Profile 1', ['admin.users.view'], 'Description 1', null, true, 1);
      const profile2 = Profile.create('Profile 2', ['admin.products.view'], 'Description 2', null, true, 2);

      userRepository.findById.mockResolvedValue(user);
      userProfileRepository.findByUserId.mockResolvedValue(assignments);
      profileRepository.findById
        .mockResolvedValueOnce(profile1)
        .mockResolvedValueOnce(profile2);

      const result = await handler.execute(request);

      expect(result.profiles).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.profiles[0].profileId).toBe(1);
      expect(result.profiles[0].profileName).toBe('Profile 1');
      expect(result.profiles[0].isActive).toBe(true);
      expect(result.profiles[1].profileId).toBe(2);
      expect(result.profiles[1].profileName).toBe('Profile 2');
      expect(result.profiles[1].isActive).toBe(false);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const request = new GetUserProfilesRequest();
      request.userId = 999;

      userRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(request)).rejects.toThrow(NotFoundException);
      expect(userProfileRepository.findByUserId).not.toHaveBeenCalled();
    });

    it('should return empty array when user has no profiles', async () => {
      const request = new GetUserProfilesRequest();
      request.userId = 1;

      const user = User.create(
        'user@example.com',
        'Test User',
        'Test',
        'User',
        '+1234567890',
        'hash',
        ['PARTNER_STAFF'],
        null,
        1,
      );

      userRepository.findById.mockResolvedValue(user);
      userProfileRepository.findByUserId.mockResolvedValue([]);

      const result = await handler.execute(request);

      expect(result.profiles).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should include both active and inactive profiles', async () => {
      const request = new GetUserProfilesRequest();
      request.userId = 1;

      const user = User.create(
        'user@example.com',
        'Test User',
        'Test',
        'User',
        '+1234567890',
        'hash',
        ['PARTNER_STAFF'],
        null,
        1,
      );

      const assignments = [
        UserProfile.create(1, 1, 2, true, 1),
        UserProfile.create(1, 2, 2, false, 2),
      ];

      const profile1 = Profile.create('Active Profile', ['admin.users.view'], null, null, true, 1);
      const profile2 = Profile.create('Inactive Profile', ['admin.products.view'], null, null, true, 2);

      userRepository.findById.mockResolvedValue(user);
      userProfileRepository.findByUserId.mockResolvedValue(assignments);
      profileRepository.findById
        .mockResolvedValueOnce(profile1)
        .mockResolvedValueOnce(profile2);

      const result = await handler.execute(request);

      expect(result.profiles).toHaveLength(2);
      expect(result.profiles[0].isActive).toBe(true);
      expect(result.profiles[1].isActive).toBe(false);
    });
  });
});

