import { ApiProperty } from '@nestjs/swagger';
import { LoyaltyProgram } from '@libs/domain';

export class UpdateLoyaltyProgramResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Programa Promocional Verano Actualizado' })
  name: string;

  @ApiProperty({ example: 'inactive', enum: ['active', 'inactive', 'draft'] })
  status: string;

  @ApiProperty({ example: '2025-01-29T10:00:00Z' })
  updatedAt: Date;

  constructor(program: LoyaltyProgram) {
    this.id = program.id;
    this.name = program.name;
    this.status = program.status;
    this.updatedAt = program.updatedAt;
  }
}
