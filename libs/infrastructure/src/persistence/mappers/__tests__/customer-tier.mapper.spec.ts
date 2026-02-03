import { CustomerTierMapper } from '@libs/infrastructure/mappers/customer/customer-tier.mapper';
import { CustomerTierEntity } from '@libs/infrastructure/entities/customer/customer-tier.entity';
import { CustomerTierBenefitEntity } from '@libs/infrastructure/entities/customer/customer-tier-benefit.entity';
import { CustomerTier } from '@libs/domain';

describe('CustomerTierMapper', () => {
  const baseDate = new Date('2024-01-01T10:00:00Z');

  describe('toDomain', () => {
    it('should convert entity with relational benefits to domain entity', () => {
      const entity = new CustomerTierEntity();
      entity.id = 1;
      entity.tenantId = 10;
      entity.name = 'Bronze';
      entity.description = 'Bronze tier';
      entity.minPoints = 0;
      entity.maxPoints = 1000;
      entity.color = '#CD7F32';
      entity.multiplier = 1.0;
      entity.icon = null;
      entity.priority = 1;
      entity.status = 'active';
      entity.createdAt = baseDate;
      entity.updatedAt = baseDate;

      // Benefits desde relación
      const benefit1 = new CustomerTierBenefitEntity();
      benefit1.id = 1;
      benefit1.tierId = 1;
      benefit1.benefit = 'Descuento 5%';

      const benefit2 = new CustomerTierBenefitEntity();
      benefit2.id = 2;
      benefit2.tierId = 1;
      benefit2.benefit = 'Envío gratis';

      entity.benefitsRelation = [benefit1, benefit2];

      const domain = CustomerTierMapper.toDomain(entity);

      expect(domain.id).toBe(1);
      expect(domain.name).toBe('Bronze');
      expect(domain.benefits).toEqual(['Descuento 5%', 'Envío gratis']);
    });

    it('should return empty array when relations are not loaded', () => {
      const entity = new CustomerTierEntity();
      entity.id = 2;
      entity.tenantId = 10;
      entity.name = 'Silver';
      entity.description = 'Silver tier';
      entity.minPoints = 1000;
      entity.maxPoints = 5000;
      entity.color = '#C0C0C0';
      entity.multiplier = 1.05;
      entity.icon = null;
      entity.priority = 2;
      entity.status = 'active';
      entity.createdAt = baseDate;
      entity.updatedAt = baseDate;

      // Simular que las relaciones no están cargadas
      entity.benefitsRelation = [];

      const domain = CustomerTierMapper.toDomain(entity);

      expect(domain.benefits).toEqual([]);
    });

    it('should handle empty benefits relation', () => {
      const entity = new CustomerTierEntity();
      entity.id = 3;
      entity.tenantId = 10;
      entity.name = 'Gold';
      entity.description = 'Gold tier';
      entity.minPoints = 5000;
      entity.maxPoints = null;
      entity.color = '#FFD700';
      entity.multiplier = 1.1;
      entity.icon = null;
      entity.priority = 3;
      entity.status = 'active';
      entity.createdAt = baseDate;
      entity.updatedAt = baseDate;

      entity.benefitsRelation = [];

      const domain = CustomerTierMapper.toDomain(entity);

      expect(domain.benefits).toEqual([]);
    });
  });

  describe('toPersistence', () => {
    it('should convert domain entity to persistence entity', () => {
      const domain = CustomerTier.create(
        10,
        'Platinum',
        10000,
        '#E5E4E2',
        ['Descuento 20%', 'Envío express gratis', 'Soporte prioritario'],
        4,
        'Platinum tier',
        null,
        1.15,
        null,
        'active',
        1,
      );

      const entity = CustomerTierMapper.toPersistence(domain);

      expect(entity.id).toBe(1);
      expect(entity.tenantId).toBe(10);
      expect(entity.name).toBe('Platinum');
      expect(entity.benefitsRelation).toBeDefined();
      expect(entity.benefitsRelation?.length).toBe(3);
      expect(entity.benefitsRelation?.map((b) => b.benefit)).toEqual([
        'Descuento 20%',
        'Envío express gratis',
        'Soporte prioritario',
      ]);
    });

    it('should not assign ID if domain ID is 0', () => {
      const domain = CustomerTier.create(10, 'New Tier', 0, '#000000', ['Benefit 1'], 1);

      const entity = CustomerTierMapper.toPersistence(domain);

      expect(entity.id).toBeUndefined();
      expect(entity.name).toBe('New Tier');
    });
  });
});
