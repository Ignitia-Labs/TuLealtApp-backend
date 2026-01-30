import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TierBenefitRepository } from '../tier-benefit.repository';
import { TierBenefitEntity } from '../../entities/tier-benefit.entity';
import { TierBenefitExclusiveRewardEntity } from '../../entities/tier-benefit-exclusive-reward.entity';
import { TierBenefitCategoryBenefitEntity } from '../../entities/tier-benefit-category-benefit.entity';
import { TierBenefitCategoryExclusiveRewardEntity } from '../../entities/tier-benefit-category-exclusive-reward.entity';
import { TierBenefit } from '@libs/domain';

describe('TierBenefitRepository', () => {
  let repository: TierBenefitRepository;
  let typeOrmRepository: Repository<TierBenefitEntity>;

  const baseDate = new Date('2024-01-01T10:00:00Z');

  const mockTierBenefitEntity: TierBenefitEntity = {
    id: 1,
    programId: 100,
    tierId: 5,
    pointsMultiplier: 1.25,
    cooldownReduction: 12,
    status: 'active',
    createdAt: baseDate,
    updatedAt: baseDate,
    higherCapsMaxPointsPerEvent: null,
    higherCapsMaxPointsPerDay: null,
    higherCapsMaxPointsPerMonth: null,
    program: null as any,
    tier: null as any,
    exclusiveRewardsRelation: [],
    categoryBenefitsRelation: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TierBenefitRepository,
        {
          provide: getRepositoryToken(TierBenefitEntity),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<TierBenefitRepository>(TierBenefitRepository);
    typeOrmRepository = module.get<Repository<TierBenefitEntity>>(getRepositoryToken(TierBenefitEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find tier benefit by id with all relations loaded', async () => {
      const benefitWithRelations = {
        ...mockTierBenefitEntity,
        exclusiveRewardsRelation: [
          { id: 1, tierBenefitId: 1, rewardId: 'reward-1' } as TierBenefitExclusiveRewardEntity,
        ],
        categoryBenefitsRelation: [],
      };

      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(benefitWithRelations);

      const result = await repository.findById(1);

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: [
          'exclusiveRewardsRelation',
          'categoryBenefitsRelation',
          'categoryBenefitsRelation.exclusiveRewardsRelation',
        ],
      });
      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.exclusiveRewards).toEqual(['reward-1']);
    });

    it('should return null when tier benefit not found', async () => {
      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByProgramIdAndTierId', () => {
    it('should find tier benefit by programId and tierId with relations loaded', async () => {
      const benefitWithRelations = {
        ...mockTierBenefitEntity,
        exclusiveRewardsRelation: [],
        categoryBenefitsRelation: [],
      };

      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(benefitWithRelations);

      const result = await repository.findByProgramIdAndTierId(100, 5);

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { programId: 100, tierId: 5, status: 'active' },
        relations: [
          'exclusiveRewardsRelation',
          'categoryBenefitsRelation',
          'categoryBenefitsRelation.exclusiveRewardsRelation',
        ],
      });
      expect(result).toBeDefined();
      expect(result?.programId).toBe(100);
      expect(result?.tierId).toBe(5);
    });
  });

  describe('findActiveByProgramId', () => {
    it('should find active tier benefits by programId with relations loaded', async () => {
      const benefitsWithRelations = [
        {
          ...mockTierBenefitEntity,
          exclusiveRewardsRelation: [],
          categoryBenefitsRelation: [],
        },
      ];

      jest.spyOn(typeOrmRepository, 'find').mockResolvedValue(benefitsWithRelations);

      const result = await repository.findActiveByProgramId(100);

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { programId: 100, status: 'active' },
        relations: [
          'exclusiveRewardsRelation',
          'categoryBenefitsRelation',
          'categoryBenefitsRelation.exclusiveRewardsRelation',
        ],
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findActiveByTierId', () => {
    it('should find active tier benefits by tierId with relations loaded', async () => {
      const benefitsWithRelations = [
        {
          ...mockTierBenefitEntity,
          exclusiveRewardsRelation: [],
          categoryBenefitsRelation: [],
        },
      ];

      jest.spyOn(typeOrmRepository, 'find').mockResolvedValue(benefitsWithRelations);

      const result = await repository.findActiveByTierId(5);

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { tierId: 5, status: 'active' },
        relations: [
          'exclusiveRewardsRelation',
          'categoryBenefitsRelation',
          'categoryBenefitsRelation.exclusiveRewardsRelation',
        ],
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('save', () => {
    it('should save tier benefit and load relations after saving', async () => {
      const benefit = TierBenefit.create(
        100,
        5,
        1.25,
        ['reward-1'],
        { maxPointsPerEvent: 1000 },
        null,
        null,
        'active',
      );

      const savedEntity = { ...mockTierBenefitEntity, id: 2 };
      const entityWithRelations = {
        ...savedEntity,
        exclusiveRewardsRelation: [
          { id: 1, tierBenefitId: 2, rewardId: 'reward-1' } as TierBenefitExclusiveRewardEntity,
        ],
        categoryBenefitsRelation: [],
      };

      jest.spyOn(typeOrmRepository, 'save').mockResolvedValue(savedEntity);
      jest.spyOn(typeOrmRepository, 'findOne').mockResolvedValue(entityWithRelations);

      const result = await repository.save(benefit);

      expect(typeOrmRepository.save).toHaveBeenCalled();
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: savedEntity.id },
        relations: [
          'exclusiveRewardsRelation',
          'categoryBenefitsRelation',
          'categoryBenefitsRelation.exclusiveRewardsRelation',
        ],
      });
      expect(result).toBeDefined();
      expect(result.programId).toBe(100);
    });
  });

  describe('delete', () => {
    it('should delete tier benefit by id', async () => {
      jest.spyOn(typeOrmRepository, 'delete').mockResolvedValue({ affected: 1 } as any);

      await repository.delete(1);

      expect(typeOrmRepository.delete).toHaveBeenCalledWith(1);
    });
  });
});
