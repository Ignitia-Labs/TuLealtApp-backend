import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfilePermissionRepository } from '../profile-permission.repository';
import { ProfilePermissionEntity } from '../../entities/profile-permission.entity';
import { ProfilePermission } from '@libs/domain';

describe('ProfilePermissionRepository', () => {
  let repository: ProfilePermissionRepository;
  let typeOrmRepository: Repository<ProfilePermissionEntity>;

  const mockProfilePermissionEntity: ProfilePermissionEntity = {
    id: 1,
    profileId: 1,
    permissionId: 2,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    profile: null as any,
    permission: null as any,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilePermissionRepository,
        {
          provide: getRepositoryToken(ProfilePermissionEntity),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<ProfilePermissionRepository>(ProfilePermissionRepository);
    typeOrmRepository = module.get<Repository<ProfilePermissionEntity>>(
      getRepositoryToken(ProfilePermissionEntity),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return a profile permission when found', async () => {
      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(mockProfilePermissionEntity);

      const result = await repository.findById(1);

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.profileId).toBe(1);
      expect(result?.permissionId).toBe(2);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return null when not found', async () => {
      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({ where: { id: 999 } });
    });
  });

  describe('findByProfileId', () => {
    it('should return all profile permissions for a profile', async () => {
      const entities = [mockProfilePermissionEntity];
      jest.spyOn(typeOrmRepository, 'find').mockResolvedValue(entities);

      const result = await repository.findByProfileId(1);

      expect(result).toHaveLength(1);
      expect(result[0].profileId).toBe(1);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { profileId: 1 },
        order: { assignedAt: 'ASC' },
      });
    });

    it('should return empty array when no permissions found', async () => {
      jest.spyOn(typeOrmRepository, 'find').mockResolvedValue([]);

      const result = await repository.findByProfileId(999);

      expect(result).toHaveLength(0);
    });
  });

  describe('findByPermissionId', () => {
    it('should return all profile permissions for a permission', async () => {
      const entities = [mockProfilePermissionEntity];
      jest.spyOn(typeOrmRepository, 'find').mockResolvedValue(entities);

      const result = await repository.findByPermissionId(2);

      expect(result).toHaveLength(1);
      expect(result[0].permissionId).toBe(2);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { permissionId: 2 },
        order: { assignedAt: 'ASC' },
      });
    });
  });

  describe('exists', () => {
    it('should return true when relation exists', async () => {
      jest.spyOn(typeOrmRepository, 'count').mockResolvedValue(1);

      const result = await repository.exists(1, 2);

      expect(result).toBe(true);
      expect(typeOrmRepository.count).toHaveBeenCalledWith({
        where: { profileId: 1, permissionId: 2 },
      });
    });

    it('should return false when relation does not exist', async () => {
      jest.spyOn(typeOrmRepository, 'count').mockResolvedValue(0);

      const result = await repository.exists(1, 999);

      expect(result).toBe(false);
    });
  });

  describe('save', () => {
    it('should save a new profile permission', async () => {
      const profilePermission = ProfilePermission.create(1, 2);
      jest.spyOn(typeOrmRepository, 'save').mockResolvedValue(mockProfilePermissionEntity);

      const result = await repository.save(profilePermission);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(typeOrmRepository.save).toHaveBeenCalled();
    });
  });

  describe('saveMany', () => {
    it('should save multiple profile permissions', async () => {
      const profilePermissions = [ProfilePermission.create(1, 2), ProfilePermission.create(1, 4)];
      const entities = [
        mockProfilePermissionEntity,
        { ...mockProfilePermissionEntity, id: 2, permissionId: 4 },
      ];
      jest.spyOn(typeOrmRepository, 'save').mockResolvedValue(entities as any);

      const result = await repository.saveMany(profilePermissions);

      expect(result).toHaveLength(2);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(expect.arrayContaining([]));
    });
  });

  describe('delete', () => {
    it('should delete a profile permission by profileId and permissionId', async () => {
      jest.spyOn(typeOrmRepository, 'delete').mockResolvedValue({ affected: 1 } as any);

      await repository.delete(1, 2);

      expect(typeOrmRepository.delete).toHaveBeenCalledWith({
        profileId: 1,
        permissionId: 2,
      });
    });
  });

  describe('deleteByProfileId', () => {
    it('should delete all profile permissions for a profile', async () => {
      jest.spyOn(typeOrmRepository, 'delete').mockResolvedValue({ affected: 2 } as any);

      await repository.deleteByProfileId(1);

      expect(typeOrmRepository.delete).toHaveBeenCalledWith({
        profileId: 1,
      });
    });
  });

  describe('deleteByPermissionId', () => {
    it('should delete all profile permissions for a permission', async () => {
      jest.spyOn(typeOrmRepository, 'delete').mockResolvedValue({ affected: 3 } as any);

      await repository.deleteByPermissionId(2);

      expect(typeOrmRepository.delete).toHaveBeenCalledWith({
        permissionId: 2,
      });
    });
  });
});
