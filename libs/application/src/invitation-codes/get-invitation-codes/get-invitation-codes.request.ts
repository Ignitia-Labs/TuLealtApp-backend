import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para obtener códigos de invitación de un tenant
 */
export class GetInvitationCodesRequest {
  @ApiProperty({
    description: 'ID del tenant',
    example: 1,
    type: Number,
  })
  tenantId: number;

  @ApiProperty({
    description: 'Filtrar por estado del código',
    example: 'active',
    enum: ['active', 'expired', 'disabled'],
    required: false,
  })
  @IsEnum(['active', 'expired', 'disabled'])
  @IsOptional()
  status?: 'active' | 'expired' | 'disabled';

  @ApiProperty({
    description: 'Incluir códigos expirados en los resultados',
    example: false,
    type: Boolean,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  includeExpired?: boolean;
}
