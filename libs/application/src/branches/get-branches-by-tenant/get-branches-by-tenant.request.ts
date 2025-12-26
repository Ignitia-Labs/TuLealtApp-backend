import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min } from 'class-validator';

/**
 * DTO de request para obtener branches por tenant
 */
export class GetBranchesByTenantRequest {
  @ApiProperty({
    description: 'ID del tenant para filtrar las branches',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  tenantId: number;
}

