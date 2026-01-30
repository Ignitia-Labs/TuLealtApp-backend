import { UserMapper } from '../user.mapper';
import { UserEntity } from '../../entities/user.entity';
import { UserRoleEntity } from '../../entities/user-role.entity';
import { UserProfileDataEntity } from '../../entities/user-profile-data.entity';
import { User } from '@libs/domain';

describe('UserMapper', () => {
  const baseDate = new Date('2024-01-01T10:00:00Z');

  describe('toDomain', () => {
    it('should convert entity with relational roles to domain entity', () => {
      const entity = new UserEntity();
      entity.id = 1;
      entity.email = 'test@example.com';
      entity.name = 'Test User';
      entity.firstName = 'Test';
      entity.lastName = 'User';
      entity.phone = '+1234567890';
      entity.passwordHash = 'hashedPassword';
      entity.isActive = true;
      entity.partnerId = 1;
      entity.tenantId = 5;
      entity.branchId = 10;
      entity.avatar = null;
      entity.status = 'active';
      entity.createdAt = baseDate;
      entity.updatedAt = baseDate;

      // Roles desde relación
      const role1 = new UserRoleEntity();
      role1.id = 1;
      role1.userId = 1;
      role1.role = 'ADMIN';

      const role2 = new UserRoleEntity();
      role2.id = 2;
      role2.userId = 1;
      role2.role = 'PARTNER';

      entity.rolesRelation = [role1, role2];
      entity.profileDataRelation = [];

      const domain = UserMapper.toDomain(entity);

      expect(domain.id).toBe(1);
      expect(domain.email).toBe('test@example.com');
      expect(domain.roles).toEqual(['ADMIN', 'PARTNER']);
      expect(domain.profile).toBeNull();
    });

    it('should convert entity with relational profile data to domain entity', () => {
      const entity = new UserEntity();
      entity.id = 2;
      entity.email = 'user2@example.com';
      entity.name = 'User Two';
      entity.firstName = 'User';
      entity.lastName = 'Two';
      entity.phone = '+9876543210';
      entity.passwordHash = 'hashedPassword2';
      entity.isActive = true;
      entity.partnerId = null;
      entity.tenantId = null;
      entity.branchId = null;
      entity.avatar = 'https://example.com/avatar.jpg';
      entity.status = 'active';
      entity.createdAt = baseDate;
      entity.updatedAt = baseDate;

      // Roles desde relación
      const role = new UserRoleEntity();
      role.id = 3;
      role.userId = 2;
      role.role = 'CUSTOMER';
      entity.rolesRelation = [role];

      // Profile data desde relación
      const profileData1 = new UserProfileDataEntity();
      profileData1.id = 1;
      profileData1.userId = 2;
      profileData1.key = 'preferences.language';
      profileData1.value = '"es"';

      const profileData2 = new UserProfileDataEntity();
      profileData2.id = 2;
      profileData2.userId = 2;
      profileData2.key = 'preferences.theme';
      profileData2.value = '"dark"';

      entity.profileDataRelation = [profileData1, profileData2];
      entity.rolesRelation = [];

      const domain = UserMapper.toDomain(entity);

      expect(domain.id).toBe(2);
      expect(domain.roles).toEqual(['CUSTOMER']);
      expect(domain.profile).toEqual({
        preferences: {
          language: 'es',
          theme: 'dark',
        },
      });
    });

    it('should return empty arrays when relations are not loaded (JSON columns removed)', () => {
      const entity = new UserEntity();
      entity.id = 3;
      entity.email = 'user3@example.com';
      entity.name = 'User Three';
      entity.firstName = 'User';
      entity.lastName = 'Three';
      entity.phone = '+1111111111';
      entity.passwordHash = 'hashedPassword3';
      entity.isActive = true;
      entity.partnerId = null;
      entity.tenantId = null;
      entity.branchId = null;
      entity.avatar = null;
      entity.status = 'active';
      entity.createdAt = baseDate;
      entity.updatedAt = baseDate;

      // Simular que las relaciones no están cargadas (columnas JSON eliminadas)
      entity.rolesRelation = [];
      entity.profileDataRelation = [];

      const domain = UserMapper.toDomain(entity);

      expect(domain.roles).toEqual(['CUSTOMER', 'PARTNER_STAFF']);
      expect(domain.profile).toEqual({
        preferences: {
          language: 'en',
        },
      });
    });

    it('should handle null roles and profile', () => {
      const entity = new UserEntity();
      entity.id = 4;
      entity.email = 'user4@example.com';
      entity.name = 'User Four';
      entity.firstName = 'User';
      entity.lastName = 'Four';
      entity.phone = '+2222222222';
      entity.passwordHash = 'hashedPassword4';
      entity.isActive = true;
      entity.partnerId = null;
      entity.tenantId = null;
      entity.branchId = null;
      entity.avatar = null;
      entity.status = 'active';
      entity.createdAt = baseDate;
      entity.updatedAt = baseDate;

      entity.rolesRelation = [];
      entity.profileDataRelation = [];

      const domain = UserMapper.toDomain(entity);

      // Cuando no hay relaciones cargadas, debe retornar arrays vacíos y null (columnas JSON eliminadas)
      expect(domain.roles).toEqual([]);
      expect(domain.profile).toBeNull();
    });
  });

  describe('toPersistence', () => {
    it('should convert domain entity to persistence entity', () => {
      const domain = User.create(
        'test@example.com',
        'Test User',
        'Test',
        'User',
        '+1234567890',
        'hashedPassword',
        ['ADMIN', 'PARTNER'],
        { preferences: { language: 'es' } },
        1,
        5,
        10,
        null,
        'active',
        1,
      );

      const entity = UserMapper.toPersistence(domain);

      expect(entity.id).toBe(1);
      expect(entity.email).toBe('test@example.com');
      expect(entity.name).toBe('Test User');
      expect(entity.rolesRelation).toBeDefined();
      expect(entity.rolesRelation?.length).toBe(2);
      expect(entity.rolesRelation?.map((r) => r.role)).toEqual(['ADMIN', 'PARTNER']);
      expect(entity.profileDataRelation).toBeDefined();
      expect(entity.profileDataRelation?.length).toBeGreaterThan(0);
    });

    it('should not assign ID if domain ID is 0', () => {
      const domain = User.create(
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

      const entity = UserMapper.toPersistence(domain);

      expect(entity.id).toBeUndefined();
      expect(entity.email).toBe('new@example.com');
    });
  });

  describe('rolesToPersistence', () => {
    it('should convert roles array to UserRoleEntity array', () => {
      const roles = ['ADMIN', 'PARTNER', 'CUSTOMER'];
      const userId = 1;

      const entities = UserMapper.rolesToPersistence(userId, roles);

      expect(entities).toHaveLength(3);
      expect(entities[0]).toEqual({ userId: 1, role: 'ADMIN' });
      expect(entities[1]).toEqual({ userId: 1, role: 'PARTNER' });
      expect(entities[2]).toEqual({ userId: 1, role: 'CUSTOMER' });
    });

    it('should handle empty roles array', () => {
      const roles: string[] = [];
      const userId = 1;

      const entities = UserMapper.rolesToPersistence(userId, roles);

      expect(entities).toHaveLength(0);
    });
  });

  describe('profileToPersistence', () => {
    it('should convert simple profile object to UserProfileDataEntity array', () => {
      const profile = {
        language: 'es',
        theme: 'dark',
      };
      const userId = 1;

      const entities = UserMapper.profileToPersistence(userId, profile);

      expect(entities).toHaveLength(2);
      expect(entities.find((e) => e.key === 'language')).toEqual({
        userId: 1,
        key: 'language',
        value: '"es"',
      });
      expect(entities.find((e) => e.key === 'theme')).toEqual({
        userId: 1,
        key: 'theme',
        value: '"dark"',
      });
    });

    it('should convert nested profile object to UserProfileDataEntity array', () => {
      const profile = {
        preferences: {
          language: 'es',
          theme: 'dark',
        },
        settings: {
          notifications: true,
        },
      };
      const userId = 1;

      const entities = UserMapper.profileToPersistence(userId, profile);

      expect(entities.length).toBeGreaterThan(0);
      expect(entities.find((e) => e.key === 'preferences.language')).toBeDefined();
      expect(entities.find((e) => e.key === 'preferences.theme')).toBeDefined();
      expect(entities.find((e) => e.key === 'settings.notifications')).toBeDefined();
    });

    it('should handle null profile', () => {
      const profile = null;
      const userId = 1;

      const entities = UserMapper.profileToPersistence(userId, profile);

      expect(entities).toHaveLength(0);
    });

    it('should handle empty profile object', () => {
      const profile = {};
      const userId = 1;

      const entities = UserMapper.profileToPersistence(userId, profile);

      expect(entities).toHaveLength(0);
    });

    it('should serialize arrays as JSON', () => {
      const profile = {
        favoriteCategories: [1, 2, 3],
      };
      const userId = 1;

      const entities = UserMapper.profileToPersistence(userId, profile);

      expect(entities).toHaveLength(1);
      expect(entities[0].key).toBe('favoriteCategories');
      expect(entities[0].value).toBe('[1,2,3]');
    });
  });
});
