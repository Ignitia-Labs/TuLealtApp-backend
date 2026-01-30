import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ICustomerMembershipRepository,
  IReferralRepository,
  IPointsTransactionRepository,
} from '@libs/domain';
import { GetReferralCodeRequest } from './get-referral-code.request';
import { GetReferralCodeResponse } from './get-referral-code.response';

/**
 * Handler para obtener o generar el código de referido de una membership
 * Nota: Por ahora usa el qrCode de la membership como código de referido
 * Se puede mejorar generando un código específico para referidos
 */
@Injectable()
export class GetReferralCodeHandler {
  constructor(
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('IReferralRepository')
    private readonly referralRepository: IReferralRepository,
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
  ) {}

  async execute(request: GetReferralCodeRequest, userId: number): Promise<GetReferralCodeResponse> {
    // Obtener membership y validar ownership
    const membership = await this.membershipRepository.findById(request.membershipId);
    if (!membership) {
      throw new NotFoundException(`Membership with ID ${request.membershipId} not found`);
    }

    // Validar que la membership pertenece al usuario
    if (membership.userId !== userId) {
      throw new NotFoundException(
        `Membership ${request.membershipId} does not belong to user ${userId}`,
      );
    }

    // Usar qrCode como código de referido (o generar uno si no existe)
    const referralCode = membership.qrCode || `REF-${membership.id}`;

    // Obtener todos los referrals del referrer
    const referrals = await this.referralRepository.findByReferrer(
      request.membershipId,
      membership.tenantId,
    );

    const totalReferrals = referrals.length;
    const activeReferrals = referrals.filter((r) => r.status === 'active').length;
    const completedReferrals = referrals.filter((r) => r.status === 'completed').length;

    // Calcular puntos ganados por referidos (buscar transacciones con reasonCode relacionado a referidos)
    const allTransactions = await this.pointsTransactionRepository.findByMembershipId(
      request.membershipId,
    );
    const referralTransactions = allTransactions.filter(
      (tx) =>
        tx.type === 'EARNING' &&
        tx.reasonCode &&
        (tx.reasonCode.includes('REFERRAL') || tx.reasonCode.includes('REFERRED')),
    );
    const pointsEarnedFromReferrals = referralTransactions.reduce(
      (sum, tx) => sum + tx.pointsDelta,
      0,
    );

    return new GetReferralCodeResponse(
      referralCode,
      totalReferrals,
      activeReferrals,
      completedReferrals,
      pointsEarnedFromReferrals,
    );
  }
}
