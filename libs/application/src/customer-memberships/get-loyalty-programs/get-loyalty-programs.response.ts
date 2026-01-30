import { ApiProperty } from '@nestjs/swagger';
import { LoyaltyProgram, Enrollment } from '@libs/domain';

export class CustomerLoyaltyProgramDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Programa Base' })
  name: string;

  @ApiProperty({
    example: 'BASE',
    enum: ['BASE', 'PROMO', 'PARTNER', 'SUBSCRIPTION', 'EXPERIMENTAL'],
  })
  programType: string;

  @ApiProperty({ example: 'active', enum: ['active', 'inactive', 'draft'] })
  status: string;

  @ApiProperty({ example: true })
  enrolled: boolean;

  @ApiProperty({ example: '2025-01-15T10:00:00Z', nullable: true })
  enrolledAt: Date | null;

  @ApiProperty({ example: 500 })
  pointsEarned: number;

  @ApiProperty({ example: { pointsName: 'Puntos' } })
  config: any;
}

export class GetCustomerLoyaltyProgramsResponse {
  @ApiProperty({ type: [CustomerLoyaltyProgramDto] })
  programs: CustomerLoyaltyProgramDto[];

  constructor(
    programs: LoyaltyProgram[],
    enrollments: Enrollment[],
    pointsByProgram: Map<number, number>,
  ) {
    const enrollmentMap = new Map<number, Enrollment>();
    enrollments.forEach((e) => enrollmentMap.set(e.programId, e));

    this.programs = programs.map((program) => {
      const enrollment = enrollmentMap.get(program.id);
      return {
        id: program.id,
        name: program.name,
        programType: program.programType,
        status: program.status,
        enrolled: !!enrollment && enrollment.isActive(),
        enrolledAt: enrollment?.createdAt || null,
        pointsEarned: pointsByProgram.get(program.id) || 0,
        config: {
          pointsName: 'Puntos', // Se puede extraer de program config si existe
        },
      };
    });
  }
}
