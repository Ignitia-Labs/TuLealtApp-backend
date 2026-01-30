import { ApiProperty } from '@nestjs/swagger';
import { LoyaltyProgram } from '@libs/domain';

export class CreateLoyaltyProgramResponse {
  @ApiProperty({ example: 2 })
  id: number;

  @ApiProperty({ example: 1 })
  tenantId: number;

  @ApiProperty({ example: 'Programa Promocional Verano' })
  name: string;

  @ApiProperty({
    example: 'PROMO',
    enum: ['BASE', 'PROMO', 'PARTNER', 'SUBSCRIPTION', 'EXPERIMENTAL'],
  })
  programType: string;

  @ApiProperty({ example: 'active', enum: ['active', 'inactive', 'draft'] })
  status: string;

  @ApiProperty({ example: '2025-01-29T10:00:00Z' })
  createdAt: Date;

  constructor(program: LoyaltyProgram) {
    this.id = program.id;
    this.tenantId = program.tenantId;
    this.name = program.name;
    this.programType = program.programType;
    this.status = program.status;
    this.createdAt = program.createdAt;
  }
}
