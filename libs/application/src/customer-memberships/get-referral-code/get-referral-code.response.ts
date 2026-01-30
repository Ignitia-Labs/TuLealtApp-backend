import { ApiProperty } from '@nestjs/swagger';

export class GetReferralCodeResponse {
  @ApiProperty({ example: 'REF-ABC123' })
  referralCode: string;

  @ApiProperty({ example: 5 })
  totalReferrals: number;

  @ApiProperty({ example: 3 })
  activeReferrals: number;

  @ApiProperty({ example: 2 })
  completedReferrals: number;

  @ApiProperty({ example: 100 })
  pointsEarnedFromReferrals: number;

  constructor(
    referralCode: string,
    totalReferrals: number,
    activeReferrals: number,
    completedReferrals: number,
    pointsEarnedFromReferrals: number,
  ) {
    this.referralCode = referralCode;
    this.totalReferrals = totalReferrals;
    this.activeReferrals = activeReferrals;
    this.completedReferrals = completedReferrals;
    this.pointsEarnedFromReferrals = pointsEarnedFromReferrals;
  }
}
