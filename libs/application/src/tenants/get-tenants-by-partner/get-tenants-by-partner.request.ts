import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min } from 'class-validator';

/**
 * DTO de request para obtener tenants por partner
 */
export class GetTenantsByPartnerRequest {
  @ApiProperty({
    description: 'ID del partner para filtrar los tenants',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  partnerId: number;
}

