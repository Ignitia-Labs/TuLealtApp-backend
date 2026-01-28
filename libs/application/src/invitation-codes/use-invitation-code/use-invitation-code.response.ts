import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para registrar uso de un código de invitación
 */
export class UseInvitationCodeResponse {
  @ApiProperty({
    description: 'ID del código de invitación',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Código de invitación',
    example: 'INV-ABC23456',
    type: String,
  })
  code: string;

  @ApiProperty({
    description: 'Número actual de usos después del incremento',
    example: 4,
    type: Number,
  })
  currentUses: number;

  @ApiProperty({
    description: 'Número máximo de usos permitidos',
    example: 10,
    type: Number,
    nullable: true,
  })
  maxUses: number | null;

  @ApiProperty({
    description: 'Estado del código después del uso',
    example: 'active',
    enum: ['active', 'expired', 'disabled'],
  })
  status: 'active' | 'expired' | 'disabled';

  @ApiProperty({
    description: 'Mensaje informativo',
    example: 'Invitation code used successfully',
    type: String,
  })
  message: string;

  constructor(
    id: number,
    code: string,
    currentUses: number,
    maxUses: number | null,
    status: 'active' | 'expired' | 'disabled',
    message: string,
  ) {
    this.id = id;
    this.code = code;
    this.currentUses = currentUses;
    this.maxUses = maxUses;
    this.status = status;
    this.message = message;
  }
}
