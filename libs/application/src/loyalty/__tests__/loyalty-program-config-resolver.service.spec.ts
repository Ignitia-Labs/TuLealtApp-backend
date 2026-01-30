import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyProgramConfigResolver } from '../loyalty-program-config-resolver.service';
import { Tenant, LoyaltyProgram } from '@libs/domain';

describe('LoyaltyProgramConfigResolver', () => {
  let service: LoyaltyProgramConfigResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoyaltyProgramConfigResolver],
    }).compile();

    service = module.get<LoyaltyProgramConfigResolver>(LoyaltyProgramConfigResolver);
  });

  describe('resolveMinPointsToRedeem', () => {
    it('should use program value when program has minPointsToRedeem > 0', () => {
      const tenant = Tenant.create(
        1,
        'Test Tenant',
        'category',
        1,
        '#000',
        '#fff',
        'CODE',
        365,
        100,
      );
      const program = LoyaltyProgram.create(
        1,
        'Test Program',
        'BASE',
        [{ domain: 'BASE_PURCHASE' }],
        0,
        { allowed: false },
        { enabled: false, type: 'simple' },
        50, // minPointsToRedeem específico del programa
      );

      const result = service.resolveMinPointsToRedeem(program, tenant);

      expect(result).toBe(50);
    });

    it('should use tenant value when program has minPointsToRedeem = 0', () => {
      const tenant = Tenant.create(
        1,
        'Test Tenant',
        'category',
        1,
        '#000',
        '#fff',
        'CODE',
        365,
        100,
      );
      const program = LoyaltyProgram.create(
        1,
        'Test Program',
        'BASE',
        [{ domain: 'BASE_PURCHASE' }],
        0,
        { allowed: false },
        { enabled: false, type: 'simple' },
        0, // minPointsToRedeem = 0, usar tenant
      );

      const result = service.resolveMinPointsToRedeem(program, tenant);

      expect(result).toBe(100); // Valor del tenant
    });

    it('should use tenant value when program is null', () => {
      const tenant = Tenant.create(
        1,
        'Test Tenant',
        'category',
        1,
        '#000',
        '#fff',
        'CODE',
        365,
        100,
      );

      const result = service.resolveMinPointsToRedeem(null, tenant);

      expect(result).toBe(100);
    });
  });

  describe('resolvePointsExpireDays', () => {
    it('should use program daysToExpire when program has expiration enabled and daysToExpire set', () => {
      const tenant = Tenant.create(
        1,
        'Test Tenant',
        'category',
        1,
        '#000',
        '#fff',
        'CODE',
        365,
        100,
      );
      const program = LoyaltyProgram.create(
        1,
        'Test Program',
        'BASE',
        [{ domain: 'BASE_PURCHASE' }],
        0,
        { allowed: false },
        { enabled: true, type: 'simple', daysToExpire: 180 }, // 180 días específico
      );

      const result = service.resolvePointsExpireDays(program, tenant);

      expect(result).toBe(180);
    });

    it('should use tenant value when program has expiration enabled but no daysToExpire', () => {
      const tenant = Tenant.create(
        1,
        'Test Tenant',
        'category',
        1,
        '#000',
        '#fff',
        'CODE',
        365,
        100,
      );
      const program = LoyaltyProgram.create(
        1,
        'Test Program',
        'BASE',
        [{ domain: 'BASE_PURCHASE' }],
        0,
        { allowed: false },
        { enabled: true, type: 'simple' }, // enabled pero sin daysToExpire
      );

      const result = service.resolvePointsExpireDays(program, tenant);

      expect(result).toBe(365); // Valor del tenant
    });

    it('should use tenant value when program has expiration disabled', () => {
      const tenant = Tenant.create(
        1,
        'Test Tenant',
        'category',
        1,
        '#000',
        '#fff',
        'CODE',
        365,
        100,
      );
      const program = LoyaltyProgram.create(
        1,
        'Test Program',
        'BASE',
        [{ domain: 'BASE_PURCHASE' }],
        0,
        { allowed: false },
        { enabled: false, type: 'simple' },
      );

      const result = service.resolvePointsExpireDays(program, tenant);

      expect(result).toBe(365); // Valor del tenant
    });

    it('should use tenant value when program is null', () => {
      const tenant = Tenant.create(
        1,
        'Test Tenant',
        'category',
        1,
        '#000',
        '#fff',
        'CODE',
        365,
        100,
      );

      const result = service.resolvePointsExpireDays(null, tenant);

      expect(result).toBe(365);
    });

    it('should return null when tenant has pointsExpireDays = 0', () => {
      const tenant = Tenant.create(1, 'Test Tenant', 'category', 1, '#000', '#fff', 'CODE', 0, 100);

      const result = service.resolvePointsExpireDays(null, tenant);

      expect(result).toBeNull(); // Nunca expira
    });
  });

  describe('isExpirationEnabled', () => {
    it('should return true when program has expiration enabled', () => {
      const tenant = Tenant.create(
        1,
        'Test Tenant',
        'category',
        1,
        '#000',
        '#fff',
        'CODE',
        365,
        100,
      );
      const program = LoyaltyProgram.create(
        1,
        'Test Program',
        'BASE',
        [{ domain: 'BASE_PURCHASE' }],
        0,
        { allowed: false },
        { enabled: true, type: 'simple' },
      );

      const result = service.isExpirationEnabled(program, tenant);

      expect(result).toBe(true);
    });

    it('should return false when program has expiration disabled', () => {
      const tenant = Tenant.create(
        1,
        'Test Tenant',
        'category',
        1,
        '#000',
        '#fff',
        'CODE',
        365,
        100,
      );
      const program = LoyaltyProgram.create(
        1,
        'Test Program',
        'BASE',
        [{ domain: 'BASE_PURCHASE' }],
        0,
        { allowed: false },
        { enabled: false, type: 'simple' },
      );

      const result = service.isExpirationEnabled(program, tenant);

      expect(result).toBe(false);
    });

    it('should return true when program is null and tenant has pointsExpireDays > 0', () => {
      const tenant = Tenant.create(
        1,
        'Test Tenant',
        'category',
        1,
        '#000',
        '#fff',
        'CODE',
        365,
        100,
      );

      const result = service.isExpirationEnabled(null, tenant);

      expect(result).toBe(true);
    });

    it('should return false when program is null and tenant has pointsExpireDays = 0', () => {
      const tenant = Tenant.create(1, 'Test Tenant', 'category', 1, '#000', '#fff', 'CODE', 0, 100);

      const result = service.isExpirationEnabled(null, tenant);

      expect(result).toBe(false);
    });
  });

  describe('getExpirationPolicyType', () => {
    it('should return program type when program has expiration enabled', () => {
      const program = LoyaltyProgram.create(
        1,
        'Test Program',
        'BASE',
        [{ domain: 'BASE_PURCHASE' }],
        0,
        { allowed: false },
        { enabled: true, type: 'bucketed' },
      );

      const result = service.getExpirationPolicyType(program);

      expect(result).toBe('bucketed');
    });

    it('should return simple when program has expiration disabled', () => {
      const program = LoyaltyProgram.create(
        1,
        'Test Program',
        'BASE',
        [{ domain: 'BASE_PURCHASE' }],
        0,
        { allowed: false },
        { enabled: false, type: 'bucketed' },
      );

      const result = service.getExpirationPolicyType(program);

      expect(result).toBe('simple'); // Default cuando no está enabled
    });

    it('should return simple when program is null', () => {
      const result = service.getExpirationPolicyType(null);

      expect(result).toBe('simple');
    });
  });
});
