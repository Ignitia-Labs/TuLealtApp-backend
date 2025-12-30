import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Request DTO para obtener asignaciones staff-partner
 */
export class GetPartnerStaffAssignmentsRequest {
  @ApiProperty({
    description: 'ID del partner (opcional)',
    example: 1,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  partnerId?: number;

  @ApiProperty({
    description: 'ID del usuario staff (opcional)',
    example: 5,
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  staffUserId?: number;

  @ApiProperty({
    description: 'Solo asignaciones activas',
    example: true,
    type: Boolean,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  activeOnly?: boolean;
}

