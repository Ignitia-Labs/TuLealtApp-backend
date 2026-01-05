import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { CreateProfileHandler } from '../create-profile/create-profile.handler';
import { CreateProfileRequest } from '../create-profile/create-profile.request';
import {
  IProfileRepository,
  IPermissionRepository,
  IProfilePermissionRepository,
  Profile,
  Permission,
} from '@libs/domain';
import { PermissionService } from '../../permissions/permission.service';

describe('CreateProfileHandler', () => {
  let handler: CreateProfileHandler;
  let profileRepository: jest.Mocked<IProfileRepository>;
  let permissionRepository: jest.Mocked<IPermissionRepository>;
  let profilePermissionRepository: jest.Mocked<IProfilePermissionRepository>;
  let permissionService: jest.Mocked<PermissionService>;

  beforeEach(async () => {
    const mockProfileRepository = {
      findByName: jest.fn(),
      save: jest.fn(),
      findPermissionsByProfileId: jest.fn(),
    };

    const mockPermissionRepository = {
      findByCode: jest.fn(),
    };

    const mockProfilePermissionRepository = {
      saveMany: jest.fn(),
    };

    const mockPermissionService = {
      validatePermissionFormat: jest.fn(),
      validatePermissionsExist: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateProfileHandler,
        {
          provide: 'IProfileRepository',
          useValue: mockProfileRepository,
        },
        {
          provide: 'IPermissionRepository',
          useValue: mockPermissionRepository,
        },
        {
          provide: 'IProfilePermissionRepository',
          useValue: mockProfilePermissionRepository,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
      ],
    }).compile();

    handler = module.get<CreateProfileHandler>(CreateProfileHandler);
    profileRepository = module.get('IProfileRepository');
    permissionRepository = module.get('IPermissionRepository');
    profilePermissionRepository = module.get('IProfilePermissionRepository');
    permissionService = module.get(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validRequest: CreateProfileRequest = {
      name: 'Test Profile',
      permissions: ['admin.users.view', 'admin.users.create'],
      description: 'Test description',
      partnerId: null,
      isActive: true,
    };

    it('should create a profile successfully', async () => {
      const savedProfile = Profile.create(
        validRequest.name,
        validRequest.permissions,
        validRequest.description,
        validRequest.partnerId,
        validRequest.isActive,
        1,
      );

      const permission1 = { id: 1, code: 'admin.users.view' } as Permission;
      const permission2 = { id: 2, code: 'admin.users.create' } as Permission;

      permissionService.validatePermissionFormat.mockReturnValue(true);
      permissionService.validatePermissionsExist.mockResolvedValue({
        valid: validRequest.permissions,
        invalid: [],
      });
      profileRepository.findByName.mockResolvedValue(null);
      profileRepository.save.mockResolvedValue(savedProfile);
      permissionRepository.findByCode
        .mockResolvedValueOnce(permission1)
        .mockResolvedValueOnce(permission2);
      profilePermissionRepository.saveMany.mockResolvedValue([]);
      profileRepository.findPermissionsByProfileId.mockResolvedValue(validRequest.permissions);

      const result = await handler.execute(validRequest);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.name).toBe(validRequest.name);
      expect(result.permissions).toEqual(validRequest.permissions);
      expect(profileRepository.save).toHaveBeenCalled();
      expect(profilePermissionRepository.saveMany).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid permission format', async () => {
      permissionService.validatePermissionFormat.mockReturnValue(false);

      await expect(handler.execute(validRequest)).rejects.toThrow(BadRequestException);
      expect(profileRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for non-existent permissions', async () => {
      permissionService.validatePermissionFormat.mockReturnValue(true);
      permissionService.validatePermissionsExist.mockResolvedValue({
        valid: ['admin.users.view'],
        invalid: ['admin.users.create'],
      });

      await expect(handler.execute(validRequest)).rejects.toThrow(BadRequestException);
      expect(profileRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException for duplicate profile name', async () => {
      const existingProfile = Profile.create('Test Profile', [], null, null, true, 1);
      permissionService.validatePermissionFormat.mockReturnValue(true);
      permissionService.validatePermissionsExist.mockResolvedValue({
        valid: validRequest.permissions,
        invalid: [],
      });
      profileRepository.findByName.mockResolvedValue(existingProfile);

      await expect(handler.execute(validRequest)).rejects.toThrow(ConflictException);
      expect(profileRepository.save).not.toHaveBeenCalled();
    });

    it('should create profile permissions in profile_permissions table', async () => {
      const savedProfile = Profile.create(
        validRequest.name,
        validRequest.permissions,
        validRequest.description,
        validRequest.partnerId,
        validRequest.isActive,
        1,
      );

      const permission1 = { id: 1, code: 'admin.users.view' } as Permission;
      const permission2 = { id: 2, code: 'admin.users.create' } as Permission;

      permissionService.validatePermissionFormat.mockReturnValue(true);
      permissionService.validatePermissionsExist.mockResolvedValue({
        valid: validRequest.permissions,
        invalid: [],
      });
      profileRepository.findByName.mockResolvedValue(null);
      profileRepository.save.mockResolvedValue(savedProfile);
      permissionRepository.findByCode
        .mockResolvedValueOnce(permission1)
        .mockResolvedValueOnce(permission2);
      profilePermissionRepository.saveMany.mockResolvedValue([]);
      profileRepository.findPermissionsByProfileId.mockResolvedValue(validRequest.permissions);

      await handler.execute(validRequest);

      expect(profilePermissionRepository.saveMany).toHaveBeenCalled();
      expect(profilePermissionRepository.saveMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            profileId: 1,
            permissionId: 1,
          }),
          expect.objectContaining({
            profileId: 1,
            permissionId: 2,
          }),
        ]),
      );
    });

    it('should load permissions from profile_permissions table for response', async () => {
      const savedProfile = Profile.create(
        validRequest.name,
        [], // Empty array after migration
        validRequest.description,
        validRequest.partnerId,
        validRequest.isActive,
        1,
      );

      const permission1 = { id: 1, code: 'admin.users.view' } as Permission;
      const permission2 = { id: 2, code: 'admin.users.create' } as Permission;

      permissionService.validatePermissionFormat.mockReturnValue(true);
      permissionService.validatePermissionsExist.mockResolvedValue({
        valid: validRequest.permissions,
        invalid: [],
      });
      profileRepository.findByName.mockResolvedValue(null);
      profileRepository.save.mockResolvedValue(savedProfile);
      permissionRepository.findByCode
        .mockResolvedValueOnce(permission1)
        .mockResolvedValueOnce(permission2);
      profilePermissionRepository.saveMany.mockResolvedValue([]);
      profileRepository.findPermissionsByProfileId.mockResolvedValue(validRequest.permissions);

      const result = await handler.execute(validRequest);

      expect(profileRepository.findPermissionsByProfileId).toHaveBeenCalledWith(1);
      expect(result.permissions).toEqual(validRequest.permissions);
    });
  });
});
