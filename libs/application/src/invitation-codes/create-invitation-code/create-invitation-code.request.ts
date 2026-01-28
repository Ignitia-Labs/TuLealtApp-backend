import { IsOptional, IsNumber, IsDateString, IsEnum, Min, IsInt, IsString, IsEmail, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de request para crear un código de invitación
 */
export class CreateInvitationCodeRequest {
  @ApiProperty({
    description: 'ID del tenant al que pertenece el código',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsInt()
  tenantId: number;

  @ApiProperty({
    description:
      'ID de la branch (opcional). Si se proporciona, el código estará asociado a esta branch específica',
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
    description: 'Tipo de código de invitación',
    example: 'text',
    enum: ['text', 'qr'],
    default: 'text',
    required: false,
  })
  @IsEnum(['text', 'qr'])
  @IsOptional()
  type?: 'text' | 'qr';

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

  @ApiPropertyOptional({
    description: 'Email del destinatario al que se enviará la invitación. Si se proporciona, se enviará un email automáticamente con el magic link.',
    example: 'customer@example.com',
    type: String,
  })
  @IsEmail()
  @IsOptional()
  recipientEmail?: string;

  @ApiPropertyOptional({
    description: 'Indica si se debe enviar el email automáticamente. Por defecto es true si se proporciona recipientEmail.',
    example: true,
    type: Boolean,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  sendEmail?: boolean;

  @ApiPropertyOptional({
    description: 'Mensaje personalizado opcional que se incluirá en el email de invitación.',
    example: '¡Únete a nuestro programa de lealtad y gana puntos con cada compra!',
    type: String,
  })
  @IsString()
  @IsOptional()
  customMessage?: string;
}
