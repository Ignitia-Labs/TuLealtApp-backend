import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para representar un enrollment con información completa (membership + programa)
 */
export class UserEnrollmentDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 50 })
  membershipId: number;

  @ApiProperty({ example: 'Café Delicia' })
  membershipTenantName: string;

  @ApiProperty({ example: 1 })
  membershipTenantId: number;

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
 * Response DTO para obtener todos los enrollments del usuario
 */
export class GetUserEnrollmentsResponse {
  @ApiProperty({ type: [UserEnrollmentDto] })
  enrollments: UserEnrollmentDto[];

  @ApiProperty({ example: 2 })
  total: number;

  constructor(enrollments: UserEnrollmentDto[]) {
    this.enrollments = enrollments;
    this.total = enrollments.length;
  }
}
