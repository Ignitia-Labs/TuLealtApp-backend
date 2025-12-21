import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

/**
 * DTO de request para obtener todos los partners
 */
export class GetPartnersRequest {
  @ApiProperty({
    description: 'Si se incluyen partners inactivos o suspendidos',
    example: false,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  includeInactive?: boolean;
}
