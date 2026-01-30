import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MembershipResolver } from '../membership-resolver.service';
import { ICustomerMembershipRepository, CustomerMembership } from '@libs/domain';
import { MembershipRef } from '@libs/domain';

describe('MembershipResolver', () => {
  let service: MembershipResolver;
  let membershipRepository: jest.Mocked<ICustomerMembershipRepository>;

  beforeEach(async () => {
    const mockMembershipRepository = {
      findById: jest.fn(),
      findByUserIdAndTenantId: jest.fn(),
      findByQrCode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipResolver,
        {
          provide: 'ICustomerMembershipRepository',
          useValue: mockMembershipRepository,
        },
      ],
    }).compile();

    service = module.get<MembershipResolver>(MembershipResolver);
    membershipRepository = module.get('ICustomerMembershipRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('resolve', () => {
    const mockMembership = CustomerMembership.create(
      10, // userId
      1, // tenantId
      null, // registrationBranchId
      100, // points
      null, // tierId
      0, // totalSpent
      0, // totalVisits
      null, // lastVisit
      new Date(), // joinedDate
      'QR-123', // qrCode
      'active', // status
      100, // id
    );

    it('should resolve membership by membershipId', async () => {
      membershipRepository.findById.mockResolvedValue(mockMembership);

      const membershipRef: MembershipRef = { membershipId: 100 };
      const result = await service.resolve(membershipRef);

      expect(result).toBe(mockMembership);
      expect(membershipRepository.findById).toHaveBeenCalledWith(100);
    });

    it('should resolve membership by customerId+tenantId', async () => {
      membershipRepository.findByUserIdAndTenantId.mockResolvedValue(mockMembership);

      const membershipRef: MembershipRef = { customerId: 10, tenantId: 1 };
      const result = await service.resolve(membershipRef);

      expect(result).toBe(mockMembership);
      expect(membershipRepository.findByUserIdAndTenantId).toHaveBeenCalledWith(10, 1);
    });

    it('should resolve membership by qrCode', async () => {
      membershipRepository.findByQrCode.mockResolvedValue(mockMembership);

      const membershipRef: MembershipRef = { qrCode: 'QR-123' };
      const result = await service.resolve(membershipRef);

      expect(result).toBe(mockMembership);
      expect(membershipRepository.findByQrCode).toHaveBeenCalledWith('QR-123');
    });

    it('should throw NotFoundException if membershipId not found', async () => {
      membershipRepository.findById.mockResolvedValue(null);

      const membershipRef: MembershipRef = { membershipId: 999 };
      await expect(service.resolve(membershipRef)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if customerId+tenantId not found', async () => {
      membershipRepository.findByUserIdAndTenantId.mockResolvedValue(null);

      const membershipRef: MembershipRef = { customerId: 999, tenantId: 1 };
      await expect(service.resolve(membershipRef)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if membershipRef is invalid', async () => {
      const membershipRef: MembershipRef = {};
      await expect(service.resolve(membershipRef)).rejects.toThrow(BadRequestException);
    });
  });

  describe('resolveActive', () => {
    const activeMembership = CustomerMembership.create(
      10,
      1,
      null,
      100,
      null,
      0,
      0,
      null,
      new Date(),
      'QR-123',
      'active',
      100,
    );

    const inactiveMembership = CustomerMembership.create(
      10,
      1,
      null,
      100,
      null,
      0,
      0,
      null,
      new Date(),
      'QR-123',
      'inactive',
      100,
    );

    it('should resolve active membership', async () => {
      membershipRepository.findById.mockResolvedValue(activeMembership);

      const membershipRef: MembershipRef = { membershipId: 100 };
      const result = await service.resolveActive(membershipRef);

      expect(result).toBe(activeMembership);
    });

    it('should throw BadRequestException if membership is inactive', async () => {
      membershipRepository.findById.mockResolvedValue(inactiveMembership);

      const membershipRef: MembershipRef = { membershipId: 100 };
      await expect(service.resolveActive(membershipRef)).rejects.toThrow(BadRequestException);
      await expect(service.resolveActive(membershipRef)).rejects.toThrow('not active');
    });
  });
});
