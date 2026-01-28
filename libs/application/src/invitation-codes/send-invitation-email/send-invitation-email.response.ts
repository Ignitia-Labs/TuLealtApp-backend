import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para re-enviar email de invitación
 */
export class SendInvitationEmailResponse {
  @ApiProperty({
    description: 'ID del código de invitación',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Email al que se envió la invitación',
    example: 'customer@example.com',
    type: String,
  })
  recipientEmail: string;

  @ApiProperty({
    description: 'Indica si el email se envió exitosamente',
    example: true,
    type: Boolean,
  })
  emailSent: boolean;

  @ApiProperty({
    description: 'URL pública del código de invitación (magic link)',
    example: 'https://app.tulealtapp.com/register?code=INV-ABC23456',
    type: String,
  })
  publicUrl: string;

  constructor(
    id: number,
    recipientEmail: string,
    emailSent: boolean,
    publicUrl: string,
  ) {
    this.id = id;
    this.recipientEmail = recipientEmail;
    this.emailSent = emailSent;
    this.publicUrl = publicUrl;
  }
}
