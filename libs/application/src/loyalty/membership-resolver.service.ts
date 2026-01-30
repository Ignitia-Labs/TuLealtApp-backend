import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ICustomerMembershipRepository, CustomerMembership } from '@libs/domain';
import { MembershipRef } from '@libs/domain';

/**
 * Servicio para resolver membershipId desde diferentes referencias
 * Soporta: membershipId directo, customerId+tenantId, o qrCode
 */
@Injectable()
export class MembershipResolver {
  constructor(
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
  ) {}

  /**
   * Resuelve membershipId desde membershipRef
   * @returns CustomerMembership si se encuentra, null si no existe
   * @throws BadRequestException si la referencia es inválida
   * @throws NotFoundException si no se encuentra la membership
   */
  async resolve(membershipRef: MembershipRef): Promise<CustomerMembership> {
    // Caso 1: membershipId directo
    if (membershipRef.membershipId) {
      const membership = await this.membershipRepository.findById(membershipRef.membershipId);
      if (!membership) {
        throw new NotFoundException(`Membership with ID ${membershipRef.membershipId} not found`);
      }
      return membership;
    }

    // Caso 2: customerId + tenantId
    if (membershipRef.customerId && membershipRef.tenantId) {
      const membership = await this.membershipRepository.findByUserIdAndTenantId(
        membershipRef.customerId,
        membershipRef.tenantId,
      );
      if (!membership) {
        throw new NotFoundException(
          `Membership for customerId ${membershipRef.customerId} and tenantId ${membershipRef.tenantId} not found`,
        );
      }
      return membership;
    }

    // Caso 3: qrCode
    if (membershipRef.qrCode) {
      const membership = await this.membershipRepository.findByQrCode(membershipRef.qrCode);
      if (!membership) {
        throw new NotFoundException(`Membership with QR code ${membershipRef.qrCode} not found`);
      }
      return membership;
    }

    // Si no hay ninguna referencia válida
    throw new BadRequestException(
      'membershipRef must have either: membershipId, or (customerId+tenantId), or qrCode',
    );
  }

  /**
   * Resuelve membershipId y valida que esté activa
   */
  async resolveActive(membershipRef: MembershipRef): Promise<CustomerMembership> {
    const membership = await this.resolve(membershipRef);

    if (membership.status !== 'active') {
      throw new BadRequestException(
        `Membership ${membership.id} is not active (status: ${membership.status})`,
      );
    }

    return membership;
  }
}
