import {
  IsOptional,
  IsNumber,
  IsDateString,
  IsEnum,
  Min,
  IsInt,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para actualizar un código de invitación
 */
export class UpdateInvitationCodeRequest {
  @ApiProperty({
    description: 'ID de la branch (opcional). Si se proporciona, el código estará asociado a esta branch específica',
    example: 5,
    type: Number,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsInt()
  @IsOptional()
  branchId?: number | null;

  @ApiProperty({
    description: 'Número máximo de usos permitidos. null para ilimitado',
    example: 10,
    type: Number,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsInt()
  @Min(1)
  @IsOptional()
  maxUses?: number | null;

  @ApiProperty({
    description: 'Fecha de expiración del código. null para sin expiración',
    example: '2024-12-31T23:59:59.000Z',
    type: String,
    required: false,
    nullable: true,
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string | null;

  @ApiProperty({
    description: 'Estado del código',
    example: 'active',
    enum: ['active', 'expired', 'disabled'],
    required: false,
  })
  @IsEnum(['active', 'expired', 'disabled'])
  @IsOptional()
  status?: 'active' | 'expired' | 'disabled';
}
