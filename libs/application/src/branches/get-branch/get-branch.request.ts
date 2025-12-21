import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener una branch por ID
 */
export class GetBranchRequest {
  @ApiProperty({
    description: 'ID de la branch',
    example: 1,
    type: Number,
  })
  @IsNumber()
  branchId: number;
}
