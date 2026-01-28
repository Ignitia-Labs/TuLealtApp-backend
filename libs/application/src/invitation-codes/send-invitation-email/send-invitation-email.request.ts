import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de request para re-enviar email de invitación
 */
export class SendInvitationEmailRequest {
  @ApiProperty({
    description: 'Email del destinatario al que se enviará la invitación',
    example: 'customer@example.com',
    type: String,
  })
  @IsEmail()
  recipientEmail: string;

  @ApiPropertyOptional({
    description: 'Mensaje personalizado opcional que se incluirá en el email de invitación.',
    example: '¡Únete a nuestro programa de lealtad y gana puntos con cada compra!',
    type: String,
  })
  @IsString()
  @IsOptional()
  customMessage?: string;
}
