import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { AssignProfileToUserHandler } from '../assign-profile-to-user/assign-profile-to-user.handler';
import { AssignProfileToUserRequest } from '../assign-profile-to-user/assign-profile-to-user.request';
import {
  IUserProfileRepository,
  IProfileRepository,
  IUserRepository,
  UserProfile,
  Profile,
  User,
} from '@libs/domain';

describe('AssignProfileToUserHandler', () => {
  let handler: AssignProfileToUserHandler;
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
        AssignProfileToUserHandler,
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

    handler = module.get<AssignProfileToUserHandler>(AssignProfileToUserHandler);
    userProfileRepository = module.get('IUserProfileRepository');
    profileRepository = module.get('IProfileRepository');
    userRepository = module.get('IUserRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should assign profile to user successfully', async () => {
      const request = new AssignProfileToUserRequest();
      request.userId = 1;
      request.profileId = 2;
      request.assignedBy = 3;

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

      const profile = Profile.create('Test Profile', ['admin.users.view'], null, null, true, 2);
      const savedUserProfile = UserProfile.create(1, 2, 3, true, 1);

      userRepository.findById.mockResolvedValue(user);
      profileRepository.findById.mockResolvedValue(profile);
      userProfileRepository.findByUserIdAndProfileId.mockResolvedValue(null);
      userProfileRepository.save.mockResolvedValue(savedUserProfile);

      const result = await handler.execute(request);

      expect(result.id).toBe(1);
      expect(result.userId).toBe(1);
      expect(result.profileId).toBe(2);
      expect(result.assignedBy).toBe(3);
      expect(result.isActive).toBe(true);
      expect(userProfileRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const request = new AssignProfileToUserRequest();
      request.userId = 999;
      request.profileId = 2;
      request.assignedBy = 3;

      userRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(request)).rejects.toThrow(NotFoundException);
      expect(userProfileRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      const request = new AssignProfileToUserRequest();
      request.userId = 1;
      request.profileId = 999;
      request.assignedBy = 3;

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
      profileRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(request)).rejects.toThrow(NotFoundException);
      expect(userProfileRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when profile is inactive', async () => {
      const request = new AssignProfileToUserRequest();
      request.userId = 1;
      request.profileId = 2;
      request.assignedBy = 3;

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

      const inactiveProfile = Profile.create(
        'Inactive Profile',
        ['admin.users.view'],
        null,
        null,
        false,
        2,
      );

      userRepository.findById.mockResolvedValue(user);
      profileRepository.findById.mockResolvedValue(inactiveProfile);

      await expect(handler.execute(request)).rejects.toThrow(ConflictException);
      expect(userProfileRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when assignment already exists and is active', async () => {
      const request = new AssignProfileToUserRequest();
      request.userId = 1;
      request.profileId = 2;
      request.assignedBy = 3;

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

      const profile = Profile.create('Test Profile', ['admin.users.view'], null, null, true, 2);
      const existingAssignment = UserProfile.create(1, 2, 3, true, 1);

      userRepository.findById.mockResolvedValue(user);
      profileRepository.findById.mockResolvedValue(profile);
      userProfileRepository.findByUserIdAndProfileId.mockResolvedValue(existingAssignment);

      await expect(handler.execute(request)).rejects.toThrow(ConflictException);
      expect(userProfileRepository.save).not.toHaveBeenCalled();
    });

    it('should reactivate inactive assignment instead of creating new one', async () => {
      const request = new AssignProfileToUserRequest();
      request.userId = 1;
      request.profileId = 2;
      request.assignedBy = 3;

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

      const profile = Profile.create('Test Profile', ['admin.users.view'], null, null, true, 2);
      const inactiveAssignment = UserProfile.create(1, 2, 3, false, 1);
      const reactivatedAssignment = inactiveAssignment.activate();

      userRepository.findById.mockResolvedValue(user);
      profileRepository.findById.mockResolvedValue(profile);
      userProfileRepository.findByUserIdAndProfileId.mockResolvedValue(inactiveAssignment);
      userProfileRepository.update.mockResolvedValue(reactivatedAssignment);

      const result = await handler.execute(request);

      expect(result.id).toBe(1);
      expect(result.isActive).toBe(true);
      expect(userProfileRepository.update).toHaveBeenCalled();
      expect(userProfileRepository.save).not.toHaveBeenCalled();
    });
  });
});
