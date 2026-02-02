import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerTierRepository } from '../customer-tier.repository';
import { CustomerTierEntity } from '../../entities/customer-tier.entity';
import { CustomerTierBenefitEntity } from '../../entities/customer-tier-benefit.entity';
import { CustomerTier } from '@libs/domain';

describe('CustomerTierRepository', () => {
  let repository: CustomerTierRepository;
  let typeOrmRepository: Repository<CustomerTierEntity>;

  const baseDate = new Date('2024-01-01T10:00:00Z');

  const mockCustomerTierEntity: CustomerTierEntity = {
    id: 1,
    tenantId: 10,
    name: 'Bronze',
    description: 'Bronze tier',
    minPoints: 0,
    maxPoints: 1000,
    color: '#CD7F32',
    multiplier: 1.0,
    icon: null,
    priority: 1,
    status: 'active',
    createdAt: baseDate,
    updatedAt: baseDate,
    tenant: null as any,
    benefitsRelation: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerTierRepository,
        {
          provide: getRepositoryToken(CustomerTierEntity),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<CustomerTierRepository>(CustomerTierRepository);
    typeOrmRepository = module.get<Repository<CustomerTierEntity>>(
      getRepositoryToken(CustomerTierEntity),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find customer tier by id with relations loaded', async () => {
      const tierWithRelations = {
        ...mockCustomerTierEntity,
        benefitsRelation: [
          { id: 1, tierId: 1, benefit: 'Descuento 5%' } as CustomerTierBenefitEntity,
        ],
      };

      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(tierWithRelations);

      const result = await repository.findById(1);

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['benefitsRelation'],
      });
      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.benefits).toEqual(['Descuento 5%']);
    });

    it('should return null when customer tier not found', async () => {
      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByTenantId', () => {
    it('should find customer tiers by tenantId with relations loaded', async () => {
      const tiersWithRelations = [
        {
          ...mockCustomerTierEntity,
          benefitsRelation: [],
        },
      ];

      jest.spyOn(typeOrmRepository, 'find').mockResolvedValue(tiersWithRelations);

      const result = await repository.findByTenantId(10);

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 10 },
        relations: ['benefitsRelation'],
        order: { priority: 'ASC' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findActiveByTenantId', () => {
    it('should find active customer tiers by tenantId with relations loaded', async () => {
      const tiersWithRelations = [
        {
          ...mockCustomerTierEntity,
          benefitsRelation: [],
        },
      ];

      jest.spyOn(typeOrmRepository, 'find').mockResolvedValue(tiersWithRelations);

      const result = await repository.findActiveByTenantId(10);

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 10, status: 'active' },
        relations: ['benefitsRelation'],
        order: { priority: 'ASC' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findByPoints', () => {
    it('should find customer tier by points with relations loaded', async () => {
      const tiersWithRelations = [
        {
          ...mockCustomerTierEntity,
          minPoints: 0,
          maxPoints: 1000,
          benefitsRelation: [],
        },
        {
          ...mockCustomerTierEntity,
          id: 2,
          name: 'Silver',
          minPoints: 1000,
          maxPoints: 5000,
          benefitsRelation: [],
        },
      ];

      jest.spyOn(typeOrmRepository, 'find').mockResolvedValue(tiersWithRelations);

      const result = await repository.findByPoints(10, 1500);

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 10, status: 'active' },
        relations: ['benefitsRelation'],
        order: { priority: 'ASC' },
      });
      expect(result).toBeDefined();
      expect(result?.name).toBe('Silver');
    });
  });

  describe('save', () => {
    it('should save customer tier and load relations after saving', async () => {
      const tier = CustomerTier.create(10, 'New Tier', 0, '#000000', ['Benefit 1', 'Benefit 2'], 1);

      const savedEntity = { ...mockCustomerTierEntity, id: 2, name: 'New Tier' };
      const entityWithRelations = {
        ...savedEntity,
        benefitsRelation: [
          { id: 1, tierId: 2, benefit: 'Benefit 1' } as CustomerTierBenefitEntity,
          { id: 2, tierId: 2, benefit: 'Benefit 2' } as CustomerTierBenefitEntity,
        ],
      };

      jest.spyOn(typeOrmRepository, 'save').mockResolvedValue(savedEntity);
      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(entityWithRelations);

      const result = await repository.save(tier);

      expect(typeOrmRepository.save).toHaveBeenCalled();
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: savedEntity.id },
        relations: ['benefitsRelation'],
      });
      expect(result).toBeDefined();
      expect(result.name).toBe('New Tier');
    });
  });

  describe('update', () => {
    it('should update customer tier and load relations after updating', async () => {
      const tier = CustomerTier.create(
        10,
        'Updated Tier',
        0,
        '#000000',
        ['Updated Benefit'],
        1,
        null,
        null,
        null,
        null,
        'active',
        1,
      );

      const updatedEntity = { ...mockCustomerTierEntity, name: 'Updated Tier' };
      const entityWithRelations = {
        ...updatedEntity,
        benefitsRelation: [
          { id: 1, tierId: 1, benefit: 'Updated Benefit' } as CustomerTierBenefitEntity,
        ],
      };

      jest.spyOn(typeOrmRepository, 'save').mockResolvedValue(updatedEntity);
      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(entityWithRelations);

      const result = await repository.update(tier);

      expect(typeOrmRepository.save).toHaveBeenCalled();
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: updatedEntity.id },
        relations: ['benefitsRelation'],
      });
      expect(result).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete customer tier by id', async () => {
      jest.spyOn(typeOrmRepository, 'delete').mockResolvedValue({ affected: 1 } as any);

      await repository.delete(1);

      expect(typeOrmRepository.delete).toHaveBeenCalledWith(1);
    });
  });
});
