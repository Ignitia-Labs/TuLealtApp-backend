import { ApiProperty } from '@nestjs/swagger';
import { Enrollment, LoyaltyProgram } from '@libs/domain';

/**
 * DTO para representar un enrollment con información del programa
 */
export class EnrollmentDetailDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  programId: number;

  @ApiProperty({ example: 'Programa Base' })
  programName: string;

  @ApiProperty({
    example: 'BASE',
    enum: ['BASE', 'PROMO', 'PARTNER', 'SUBSCRIPTION', 'EXPERIMENTAL'],
  })
  programType: string;

  @ApiProperty({
    example: 'ACTIVE',
    enum: ['ACTIVE', 'PAUSED', 'ENDED'],
  })
  status: string;

  @ApiProperty({ example: '2025-02-01T10:00:00Z' })
  effectiveFrom: Date;

  @ApiProperty({ example: null, nullable: true })
  effectiveTo: Date | null;

  @ApiProperty({ example: '2025-02-01T10:00:00Z' })
  enrolledAt: Date;

  @ApiProperty({ example: 150, description: 'Puntos ganados en este programa' })
  pointsEarned: number;
}

/**
 * Response DTO para obtener enrollments de una membership
 */
export class GetMembershipEnrollmentsResponse {
  @ApiProperty({ type: [EnrollmentDetailDto] })
  enrollments: EnrollmentDetailDto[];

  constructor(enrollments: EnrollmentDetailDto[]) {
    this.enrollments = enrollments;
  }
}
