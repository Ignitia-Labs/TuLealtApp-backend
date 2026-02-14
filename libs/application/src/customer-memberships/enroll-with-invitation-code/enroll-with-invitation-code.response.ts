import { ApiProperty } from '@nestjs/swagger';
import { CustomerMembershipDto } from '../dto/customer-membership.dto';

export class EnrollmentInfoDto {
  @ApiProperty({ example: 1 })
  enrollmentId: number;

  @ApiProperty({ example: 1 })
  programId: number;

  @ApiProperty({ example: 'Programa Base' })
  programName: string;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'PAUSED', 'ENDED'] })
  status: string;

  @ApiProperty({ example: '2025-01-29T10:00:00Z' })
  enrolledAt: Date;

  constructor(
    enrollmentId: number,
    programId: number,
    programName: string,
    status: string,
    enrolledAt: Date,
  ) {
    this.enrollmentId = enrollmentId;
    this.programId = programId;
    this.programName = programName;
    this.status = status;
    this.enrolledAt = enrolledAt;
  }
}

export class EnrollWithInvitationCodeResponse {
  @ApiProperty({
    description: 'Información de la membership creada o existente',
    type: CustomerMembershipDto,
  })
  membership: CustomerMembershipDto;

  @ApiProperty({
    description: 'Información del enrollment al programa BASE',
    type: EnrollmentInfoDto,
  })
  enrollment: EnrollmentInfoDto;

  @ApiProperty({
    description: 'Indica si la membership fue creada o ya existía',
    example: true,
  })
  membershipCreated: boolean;

  constructor(
    membership: CustomerMembershipDto,
    enrollment: EnrollmentInfoDto,
    membershipCreated: boolean,
  ) {
    this.membership = membership;
    this.enrollment = enrollment;
    this.membershipCreated = membershipCreated;
  }
}
