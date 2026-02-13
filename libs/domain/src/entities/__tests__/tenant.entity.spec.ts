import { Tenant } from '../system/tenant.entity';

describe('Tenant Entity', () => {
  describe('create', () => {
    it('should create tenant with default redemptionCodeTtlMinutes (15 minutes)', () => {
      const tenant = Tenant.create(
        1, // partnerId
        'Test Tenant',
        'retail',
        1, // currencyId
        '#FF0000',
        '#00FF00',
        'TEST123',
      );

      expect(tenant.redemptionCodeTtlMinutes).toBe(15);
    });

    it('should create tenant with custom redemptionCodeTtlMinutes', () => {
      const tenant = Tenant.create(
        1,
        'Test Tenant',
        'retail',
        1,
        '#FF0000',
        '#00FF00',
        'TEST123',
        365, // pointsExpireDays
        100, // minPointsToRedeem
        null, // description
        null, // logo
        null, // banner
        'active', // status
        0, // taxPercentage
        60, // redemptionCodeTtlMinutes (1 hora)
      );

      expect(tenant.redemptionCodeTtlMinutes).toBe(60);
    });

    it('should throw error if redemptionCodeTtlMinutes is less than 15', () => {
      expect(() => {
        Tenant.create(
          1,
          'Test Tenant',
          'retail',
          1,
          '#FF0000',
          '#00FF00',
          'TEST123',
          365,
          100,
          null,
          null,
          null,
          'active',
          0,
          14, // ❌ Invalid (< 15)
        );
      }).toThrow('redemptionCodeTtlMinutes must be at least 15 minutes');
    });

    it('should throw error if redemptionCodeTtlMinutes is 0', () => {
      expect(() => {
        Tenant.create(
          1,
          'Test Tenant',
          'retail',
          1,
          '#FF0000',
          '#00FF00',
          'TEST123',
          365,
          100,
          null,
          null,
          null,
          'active',
          0,
          0, // ❌ Invalid
        );
      }).toThrow('redemptionCodeTtlMinutes must be at least 15 minutes');
    });

    it('should throw error if redemptionCodeTtlMinutes is negative', () => {
      expect(() => {
        Tenant.create(
          1,
          'Test Tenant',
          'retail',
          1,
          '#FF0000',
          '#00FF00',
          'TEST123',
          365,
          100,
          null,
          null,
          null,
          'active',
          0,
          -10, // ❌ Invalid
        );
      }).toThrow('redemptionCodeTtlMinutes must be at least 15 minutes');
    });
  });

  describe('calculateRedemptionCodeExpirationDate', () => {
    it('should calculate expiration date correctly (15 minutes)', () => {
      const tenant = Tenant.create(
        1,
        'Test Tenant',
        'retail',
        1,
        '#FF0000',
        '#00FF00',
        'TEST123',
        365,
        100,
        null,
        null,
        null,
        'active',
        0,
        15, // 15 minutos
      );

      const fromDate = new Date('2026-02-12T10:00:00Z');
      const expiresAt = tenant.calculateRedemptionCodeExpirationDate(fromDate);

      const expected = new Date('2026-02-12T10:15:00Z');
      expect(expiresAt.getTime()).toBe(expected.getTime());
    });

    it('should calculate expiration date correctly (1 hour)', () => {
      const tenant = Tenant.create(
        1,
        'Test Tenant',
        'retail',
        1,
        '#FF0000',
        '#00FF00',
        'TEST123',
        365,
        100,
        null,
        null,
        null,
        'active',
        0,
        60, // 1 hora
      );

      const fromDate = new Date('2026-02-12T10:00:00Z');
      const expiresAt = tenant.calculateRedemptionCodeExpirationDate(fromDate);

      const expected = new Date('2026-02-12T11:00:00Z');
      expect(expiresAt.getTime()).toBe(expected.getTime());
    });

    it('should calculate expiration date correctly (24 hours)', () => {
      const tenant = Tenant.create(
        1,
        'Test Tenant',
        'retail',
        1,
        '#FF0000',
        '#00FF00',
        'TEST123',
        365,
        100,
        null,
        null,
        null,
        'active',
        0,
        1440, // 24 horas
      );

      const fromDate = new Date('2026-02-12T00:00:00Z');
      const expiresAt = tenant.calculateRedemptionCodeExpirationDate(fromDate);

      const expected = new Date('2026-02-13T00:00:00Z');
      expect(expiresAt.getTime()).toBe(expected.getTime());
    });

    it('should calculate expiration date correctly (7 days)', () => {
      const tenant = Tenant.create(
        1,
        'Test Tenant',
        'retail',
        1,
        '#FF0000',
        '#00FF00',
        'TEST123',
        365,
        100,
        null,
        null,
        null,
        'active',
        0,
        10080, // 7 días
      );

      const fromDate = new Date('2026-02-01T00:00:00Z');
      const expiresAt = tenant.calculateRedemptionCodeExpirationDate(fromDate);

      const expected = new Date('2026-02-08T00:00:00Z');
      expect(expiresAt.getTime()).toBe(expected.getTime());
    });

    it('should use current date if fromDate not provided', () => {
      const tenant = Tenant.create(
        1,
        'Test Tenant',
        'retail',
        1,
        '#FF0000',
        '#00FF00',
        'TEST123',
        365,
        100,
        null,
        null,
        null,
        'active',
        0,
        60, // 1 hora
      );

      const before = new Date();
      const expiresAt = tenant.calculateRedemptionCodeExpirationDate();
      const after = new Date();

      // expiresAt debe estar aproximadamente 1 hora en el futuro
      const expectedMin = new Date(before.getTime() + 60 * 60 * 1000);
      const expectedMax = new Date(after.getTime() + 60 * 60 * 1000);

      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime() - 1000); // Tolerancia de 1 segundo
      expect(expiresAt.getTime()).toBeLessThanOrEqual(expectedMax.getTime() + 1000);
    });
  });

  describe('suspend', () => {
    it('should preserve redemptionCodeTtlMinutes when suspending', () => {
      const tenant = Tenant.create(
        1,
        'Test Tenant',
        'retail',
        1,
        '#FF0000',
        '#00FF00',
        'TEST123',
        365,
        100,
        null,
        null,
        null,
        'active',
        0,
        120, // 2 horas
      );

      const suspended = tenant.suspend();

      expect(suspended.redemptionCodeTtlMinutes).toBe(120);
      expect(suspended.status).toBe('suspended');
    });
  });

  describe('activate', () => {
    it('should preserve redemptionCodeTtlMinutes when activating', () => {
      const tenant = Tenant.create(
        1,
        'Test Tenant',
        'retail',
        1,
        '#FF0000',
        '#00FF00',
        'TEST123',
        365,
        100,
        null,
        null,
        null,
        'suspended',
        0,
        180, // 3 horas
      );

      const activated = tenant.activate();

      expect(activated.redemptionCodeTtlMinutes).toBe(180);
      expect(activated.status).toBe('active');
    });
  });
});
