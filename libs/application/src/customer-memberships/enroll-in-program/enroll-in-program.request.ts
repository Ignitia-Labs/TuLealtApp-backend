import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class EnrollInProgramRequest {
  @ApiProperty({ example: 100, description: 'ID de la membership' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  membershipId: number;

  @ApiProperty({ example: 1, description: 'ID del programa de lealtad' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  programId: number;
}
