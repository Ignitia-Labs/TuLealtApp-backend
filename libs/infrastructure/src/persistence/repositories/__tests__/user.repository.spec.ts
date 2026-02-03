import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepository } from '@libs/infrastructure/repositories/auth/user.repository';
import { UserEntity } from '@libs/infrastructure/entities/auth/user.entity';
import { UserRoleEntity } from '@libs/infrastructure/entities/auth/user-role.entity';
import { UserProfileDataEntity } from '@libs/infrastructure/entities/auth/user-profile-data.entity';
import { User } from '@libs/domain';

describe('UserRepository', () => {
  let repository: UserRepository;
  let typeOrmRepository: Repository<UserEntity>;

  const baseDate = new Date('2024-01-01T10:00:00Z');

  const mockUserEntity: UserEntity = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    phone: '+1234567890',
    passwordHash: 'hashedPassword',
    isActive: true,
    partnerId: 1,
    tenantId: 5,
    branchId: 10,
    avatar: null,
    status: 'active',
    createdAt: baseDate,
    updatedAt: baseDate,
    tenant: null as any,
    partner: null as any,
    branch: null as any,
    rolesRelation: [],
    profileDataRelation: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    typeOrmRepository = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find user by id with relations loaded', async () => {
      const userWithRelations = {
        ...mockUserEntity,
        rolesRelation: [
          { id: 1, userId: 1, role: 'ADMIN' } as UserRoleEntity,
          { id: 2, userId: 1, role: 'PARTNER' } as UserRoleEntity,
        ],
        profileDataRelation: [],
      };

      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(userWithRelations);

      const result = await repository.findById(1);

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['rolesRelation', 'profileDataRelation'],
      });
      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.roles).toEqual(['ADMIN', 'PARTNER']);
    });

    it('should return null when user not found', async () => {
      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email with relations loaded', async () => {
      const userWithRelations = {
        ...mockUserEntity,
        rolesRelation: [{ id: 1, userId: 1, role: 'CUSTOMER' } as UserRoleEntity],
        profileDataRelation: [],
      };

      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(userWithRelations);

      const result = await repository.findByEmail('test@example.com');

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        relations: ['rolesRelation', 'profileDataRelation'],
      });
      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
    });
  });

  describe('findByRoles', () => {
    it('should find users by roles using JOIN instead of JSON_CONTAINS', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            ...mockUserEntity,
            rolesRelation: [{ id: 1, userId: 1, role: 'ADMIN' } as UserRoleEntity],
            profileDataRelation: [],
          },
        ]),
      };

      jest.spyOn(typeOrmRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await repository.findByRoles(['ADMIN'], 0, 10);

      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'user.rolesRelation',
        'userRole',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'user.profileDataRelation',
        'profileData',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('user.isActive = :isActive', {
        isActive: true,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('userRole.role IN (:...roles)', {
        roles: ['ADMIN'],
      });
      expect(result).toHaveLength(1);
      expect(result[0].roles).toEqual(['ADMIN']);
    });

    it('should handle multiple roles', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            ...mockUserEntity,
            rolesRelation: [
              { id: 1, userId: 1, role: 'ADMIN' } as UserRoleEntity,
              { id: 2, userId: 1, role: 'PARTNER' } as UserRoleEntity,
            ],
            profileDataRelation: [],
          },
        ]),
      };

      jest.spyOn(typeOrmRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await repository.findByRoles(['ADMIN', 'PARTNER'], 0, 10);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('userRole.role IN (:...roles)', {
        roles: ['ADMIN', 'PARTNER'],
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('countByRoles', () => {
    it('should count users by roles using JOIN instead of JSON_CONTAINS', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
      };

      jest.spyOn(typeOrmRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await repository.countByRoles(['ADMIN']);

      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith('user.rolesRelation', 'userRole');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('user.isActive = :isActive', {
        isActive: true,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('userRole.role IN (:...roles)', {
        roles: ['ADMIN'],
      });
      expect(result).toBe(5);
    });
  });

  describe('findByPartnerIdAndRoles', () => {
    it('should find users by partnerId and roles using JOIN', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            ...mockUserEntity,
            partnerId: 1,
            rolesRelation: [{ id: 1, userId: 1, role: 'PARTNER_STAFF' } as UserRoleEntity],
            profileDataRelation: [],
          },
        ]),
      };

      jest.spyOn(typeOrmRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await repository.findByPartnerIdAndRoles(1, ['PARTNER_STAFF'], 0, 10, false);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('user.partnerId = :partnerId', {
        partnerId: 1,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('user.isActive = :isActive', {
        isActive: true,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('userRole.role IN (:...roles)', {
        roles: ['PARTNER_STAFF'],
      });
      expect(result).toHaveLength(1);
    });

    it('should include inactive users when includeInactive is true', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(typeOrmRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      await repository.findByPartnerIdAndRoles(1, ['PARTNER_STAFF'], 0, 10, true);

      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        'user.isActive = :isActive',
        expect.anything(),
      );
    });
  });

  describe('countByPartnerIdAndRoles', () => {
    it('should count users by partnerId and roles using JOIN', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(3),
      };

      jest.spyOn(typeOrmRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await repository.countByPartnerIdAndRoles(1, ['PARTNER_STAFF'], false);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('user.partnerId = :partnerId', {
        partnerId: 1,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('user.isActive = :isActive', {
        isActive: true,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('userRole.role IN (:...roles)', {
        roles: ['PARTNER_STAFF'],
      });
      expect(result).toBe(3);
    });
  });

  describe('save', () => {
    it('should save user and load relations after saving', async () => {
      const user = User.create(
        'new@example.com',
        'New User',
        'New',
        'User',
        '+9999999999',
        'hashedPassword',
        ['CUSTOMER'],
        null,
        null,
        null,
        null,
        'active',
      );

      const savedEntity = { ...mockUserEntity, id: 2, email: 'new@example.com' };
      const entityWithRelations = {
        ...savedEntity,
        rolesRelation: [{ id: 3, userId: 2, role: 'CUSTOMER' } as UserRoleEntity],
        profileDataRelation: [],
      };

      jest.spyOn(typeOrmRepository, 'save').mockResolvedValue(savedEntity);
      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(entityWithRelations);

      const result = await repository.save(user);

      expect(typeOrmRepository.save).toHaveBeenCalled();
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: savedEntity.id },
        relations: ['rolesRelation', 'profileDataRelation'],
      });
      expect(result).toBeDefined();
      expect(result.email).toBe('new@example.com');
    });
  });

  describe('delete', () => {
    it('should delete user by id', async () => {
      jest.spyOn(typeOrmRepository, 'delete').mockResolvedValue({ affected: 1 } as any);

      await repository.delete(1);

      expect(typeOrmRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('count', () => {
    it('should return total count of users', async () => {
      jest.spyOn(typeOrmRepository, 'count').mockResolvedValue(10);

      const result = await repository.count();

      expect(result).toBe(10);
    });
  });
});
