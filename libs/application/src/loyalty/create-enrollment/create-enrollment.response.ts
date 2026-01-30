import { ApiProperty } from '@nestjs/swagger';
import { Enrollment } from '@libs/domain';

export class CreateEnrollmentResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  programId: number;

  @ApiProperty({ example: 100 })
  membershipId: number;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'PAUSED', 'ENDED'] })
  status: string;

  @ApiProperty({ example: '2025-01-29T10:00:00Z' })
  enrolledAt: Date;

  constructor(enrollment: Enrollment) {
    this.id = enrollment.id;
    this.programId = enrollment.programId;
    this.membershipId = enrollment.membershipId;
    this.status = enrollment.status;
    this.enrolledAt = enrollment.createdAt;
  }
}
