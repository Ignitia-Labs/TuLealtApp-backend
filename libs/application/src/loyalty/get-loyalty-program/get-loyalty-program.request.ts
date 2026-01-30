import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetLoyaltyProgramRequest {
  @ApiProperty({ example: 1, description: 'ID del tenant' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tenantId: number;

  @ApiProperty({ example: 1, description: 'ID del programa de lealtad' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  programId: number;
}
