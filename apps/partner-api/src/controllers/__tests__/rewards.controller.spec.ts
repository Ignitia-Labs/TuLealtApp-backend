import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { RewardsController } from '../rewards.controller';
import {
  CreateRewardHandler,
  CreateRewardRequest,
  CreateRewardResponse,
  GetRewardsHandler,
  GetRewardHandler,
  UpdateRewardHandler,
  DeleteRewardHandler,
  ValidateRedemptionCodeHandler,
  GetTopRedeemedRewardsHandler,
  GetAdvancedRewardAnalyticsHandler,
} from '@libs/application';
import { IUserRepository, ITenantRepository } from '@libs/domain';
import { S3Service, ImageOptimizerService } from '@libs/infrastructure';

const validBase64Png = 'data:image/png;base64,iVBORw0KGgo=';

describe('RewardsController', () => {
  let controller: RewardsController;
  let createRewardHandler: jest.Mocked<CreateRewardHandler>;
  let s3Service: jest.Mocked<S3Service>;
  let imageOptimizerService: jest.Mocked<ImageOptimizerService>;

  const tenantId = 1;
  const validBody: CreateRewardRequest = {
    tenantId: 0,
    name: 'Test Reward',
    description: 'A test reward',
    pointsRequired: 100,
    stock: 50,
    category: 'Discounts',
    status: 'draft',
  } as CreateRewardRequest;

  const mockCreateResponse: CreateRewardResponse = {
    id: 1,
    tenantId: 1,
    name: 'Test Reward',
    description: 'A test reward',
    image: null,
    pointsRequired: 100,
    stock: 50,
    maxRedemptionsPerUser: null,
    status: 'draft',
    category: 'Discounts',
    terms: null,
    validUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    totalRedemptions: 0,
  } as CreateRewardResponse;

  beforeEach(async () => {
    const mockCreateRewardHandler = { execute: jest.fn() };
    const mockGetRewardsHandler = { execute: jest.fn() };
    const mockGetRewardHandler = { execute: jest.fn() };
    const mockUpdateRewardHandler = { execute: jest.fn() };
    const mockDeleteRewardHandler = { execute: jest.fn() };
    const mockValidateRedemptionCodeHandler = { execute: jest.fn() };
    const mockGetTopRedeemedRewardsHandler = { execute: jest.fn() };
    const mockGetAdvancedRewardAnalyticsHandler = { execute: jest.fn() };
    const mockUserRepository = { findById: jest.fn() };
    const mockTenantRepository = { findById: jest.fn() };
    const mockS3Service = { uploadFile: jest.fn() };
    const mockImageOptimizerService = { optimize: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RewardsController],
      providers: [
        { provide: CreateRewardHandler, useValue: mockCreateRewardHandler },
        { provide: GetRewardsHandler, useValue: mockGetRewardsHandler },
        { provide: GetRewardHandler, useValue: mockGetRewardHandler },
        { provide: UpdateRewardHandler, useValue: mockUpdateRewardHandler },
        { provide: DeleteRewardHandler, useValue: mockDeleteRewardHandler },
        { provide: ValidateRedemptionCodeHandler, useValue: mockValidateRedemptionCodeHandler },
        { provide: GetTopRedeemedRewardsHandler, useValue: mockGetTopRedeemedRewardsHandler },
        { provide: GetAdvancedRewardAnalyticsHandler, useValue: mockGetAdvancedRewardAnalyticsHandler },
        { provide: 'IUserRepository', useValue: mockUserRepository },
        { provide: 'ITenantRepository', useValue: mockTenantRepository },
        { provide: S3Service, useValue: mockS3Service },
        { provide: ImageOptimizerService, useValue: mockImageOptimizerService },
      ],
    }).compile();

    controller = module.get<RewardsController>(RewardsController);
    createRewardHandler = module.get(CreateRewardHandler);
    s3Service = module.get(S3Service);
    imageOptimizerService = module.get(ImageOptimizerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createReward', () => {
    it('should create reward without image (JSON only)', async () => {
      const body = { ...validBody };
      createRewardHandler.execute.mockResolvedValue(mockCreateResponse);

      const result = await controller.createReward(tenantId, body);

      expect(createRewardHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 1, name: 'Test Reward' }),
      );
      expect(result).toEqual(mockCreateResponse);
      expect(s3Service.uploadFile).not.toHaveBeenCalled();
      expect(imageOptimizerService.optimize).not.toHaveBeenCalled();
    });

    it('should create reward with base64 image: optimize, upload to S3, set image URL', async () => {
      const body = { ...validBody, image: validBase64Png };
      const optimizedFile = {
        fieldname: 'image',
        originalname: 'image.webp',
        encoding: '7bit',
        mimetype: 'image/webp',
        size: 10,
        buffer: Buffer.from('optimized'),
      };
      const imageUrl = 'http://localhost:9000/tulealtapp-images/rewards/abc.webp';

      imageOptimizerService.optimize.mockResolvedValue(optimizedFile as any);
      s3Service.uploadFile.mockResolvedValue(imageUrl);
      createRewardHandler.execute.mockResolvedValue({ ...mockCreateResponse, image: imageUrl } as CreateRewardResponse);

      const result = await controller.createReward(tenantId, body);

      expect(imageOptimizerService.optimize).toHaveBeenCalledWith(
        expect.objectContaining({ mimetype: 'image/png', fieldname: 'image' }),
      );
      expect(s3Service.uploadFile).toHaveBeenCalledWith(optimizedFile, 'rewards');
      expect(body.image).toBe(imageUrl);
      expect(createRewardHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 1, image: imageUrl }),
      );
      expect(result.image).toBe(imageUrl);
    });

    it('should throw BadRequestException for invalid MIME type (base64)', async () => {
      const body = { ...validBody, image: 'data:image/gif;base64,iVBORw0KGgo=' };

      await expect(controller.createReward(tenantId, body)).rejects.toThrow(BadRequestException);
      await expect(controller.createReward(tenantId, body)).rejects.toThrow(
        'Invalid image format. Only png, jpg, jpeg and webp are allowed',
      );
      expect(createRewardHandler.execute).not.toHaveBeenCalled();
      expect(s3Service.uploadFile).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when base64 image exceeds 5MB', async () => {
      const bigPayload = Buffer.alloc(5 * 1024 * 1024 + 1).toString('base64');
      const body = { ...validBody, image: `data:image/png;base64,${bigPayload}` };

      await expect(controller.createReward(tenantId, body)).rejects.toThrow(BadRequestException);
      await expect(controller.createReward(tenantId, body)).rejects.toThrow('Image size exceeds 5MB limit');
      expect(createRewardHandler.execute).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when S3 upload fails (base64)', async () => {
      const body = { ...validBody, image: validBase64Png };
      imageOptimizerService.optimize.mockResolvedValue({
        fieldname: 'image',
        originalname: 'x.webp',
        encoding: '7bit',
        mimetype: 'image/webp',
        size: 1,
        buffer: Buffer.alloc(1),
      } as any);
      s3Service.uploadFile.mockRejectedValue(new Error('S3 error'));

      await expect(controller.createReward(tenantId, body)).rejects.toThrow(BadRequestException);
      await expect(controller.createReward(tenantId, body)).rejects.toThrow(
        'Failed to upload image: S3 error',
      );
      expect(createRewardHandler.execute).not.toHaveBeenCalled();
    });
  });
});
