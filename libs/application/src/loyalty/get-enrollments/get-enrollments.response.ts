import { ApiProperty } from '@nestjs/swagger';
import { Enrollment } from '@libs/domain';

export class EnrollmentDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  programId: number;

  @ApiProperty({ example: 100 })
  membershipId: number;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'PAUSED', 'ENDED'] })
  status: string;

  @ApiProperty({ example: '2025-01-15T10:00:00Z' })
  effectiveFrom: Date;

  @ApiProperty({ example: null, nullable: true })
  effectiveTo: Date | null;

  @ApiProperty({ example: '2025-01-15T10:00:00Z' })
  enrolledAt: Date;
}

export class EnrollmentPaginationDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 150 })
  total: number;

  @ApiProperty({ example: 8 })
  totalPages: number;
}

export class GetEnrollmentsResponse {
  @ApiProperty({ type: [EnrollmentDto] })
  enrollments: EnrollmentDto[];

  @ApiProperty({ type: EnrollmentPaginationDto })
  pagination: EnrollmentPaginationDto;

  constructor(enrollments: Enrollment[], total: number, page: number, limit: number) {
    this.enrollments = enrollments.map((e) => ({
      id: e.id,
      programId: e.programId,
      membershipId: e.membershipId,
      status: e.status,
      effectiveFrom: e.effectiveFrom,
      effectiveTo: e.effectiveTo,
      enrolledAt: e.createdAt,
    }));

    this.pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    } as EnrollmentPaginationDto;
  }
}
