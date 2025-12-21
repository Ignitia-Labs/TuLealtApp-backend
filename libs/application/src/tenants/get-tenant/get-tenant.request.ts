import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener un tenant por ID
 */
export class GetTenantRequest {
  @ApiProperty({
    description: 'ID del tenant',
    example: 1,
    type: Number,
  })
  @IsNumber()
  tenantId: number;
}
