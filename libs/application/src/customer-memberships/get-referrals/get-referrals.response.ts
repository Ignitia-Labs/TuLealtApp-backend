import { ApiProperty } from '@nestjs/swagger';
import { Referral } from '@libs/domain';

export class ReferralDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 101 })
  referredMembershipId: number;

  @ApiProperty({ example: 'active', enum: ['pending', 'active', 'completed', 'cancelled'] })
  status: string;

  @ApiProperty({ example: '2025-01-20T10:00:00Z' })
  referredAt: Date;

  @ApiProperty({ example: true })
  firstPurchaseCompleted: boolean;

  @ApiProperty({ example: '2025-01-25T15:30:00Z', nullable: true })
  firstPurchaseCompletedAt: Date | null;

  @ApiProperty({ example: true })
  rewardGranted: boolean;

  @ApiProperty({ example: '2025-01-25T15:35:00Z', nullable: true })
  rewardGrantedAt: Date | null;
}

export class GetReferralsResponse {
  @ApiProperty({ type: [ReferralDto] })
  referrals: ReferralDto[];

  constructor(referrals: Referral[]) {
    this.referrals = referrals.map((r) => ({
      id: r.id,
      referredMembershipId: r.referredMembershipId,
      status: r.status,
      referredAt: r.createdAt,
      firstPurchaseCompleted: r.firstPurchaseCompleted,
      firstPurchaseCompletedAt: r.firstPurchaseCompletedAt,
      rewardGranted: r.rewardGranted,
      rewardGrantedAt: r.rewardGrantedAt,
    }));
  }
}
