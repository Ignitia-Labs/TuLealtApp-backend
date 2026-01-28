import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para validar un código de invitación
 * Retorna información pública del código y del tenant asociado
 */
export class ValidateInvitationCodeResponse {
  @ApiProperty({
    description: 'Indica si el código es válido y está activo',
    example: true,
    type: Boolean,
  })
  isValid: boolean;

  @ApiProperty({
    description: 'Código de invitación',
    example: 'INV-ABC23456',
    type: String,
  })
  code: string;

  @ApiProperty({
    description: 'Información del tenant asociado al código',
    type: Object,
    nullable: true,
  })
  tenant: {
    id: number;
    name: string;
    logo: string | null;
    description: string | null;
    primaryColor: string;
    secondaryColor: string;
  } | null;

  @ApiProperty({
    description: 'Información de la branch asociada (si aplica)',
    type: Object,
    nullable: true,
  })
  branch: {
    id: number;
    name: string;
  } | null;

  @ApiProperty({
    description: 'Mensaje de estado del código',
    example: 'Código válido',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'Fecha de expiración del código',
    example: '2024-12-31T23:59:59.000Z',
    type: Date,
    nullable: true,
  })
  expiresAt: Date | null;

  @ApiProperty({
    description: 'Número máximo de usos permitidos',
    example: 10,
    type: Number,
    nullable: true,
  })
  maxUses: number | null;

  @ApiProperty({
    description: 'Número actual de usos',
    example: 3,
    type: Number,
  })
  currentUses: number;

  @ApiProperty({
    description: 'URL pública para registro con este código (magic link)',
    example: 'https://app.tulealtapp.com/register?code=INV-ABC23456',
    type: String,
  })
  publicUrl: string;

  constructor(
    isValid: boolean,
    code: string,
    tenant: {
      id: number;
      name: string;
      logo: string | null;
      description: string | null;
      primaryColor: string;
      secondaryColor: string;
    } | null,
    branch: {
      id: number;
      name: string;
    } | null,
    message: string,
    expiresAt: Date | null,
    maxUses: number | null,
    currentUses: number,
    publicUrl: string,
  ) {
    this.isValid = isValid;
    this.code = code;
    this.tenant = tenant;
    this.branch = branch;
    this.message = message;
    this.expiresAt = expiresAt;
    this.maxUses = maxUses;
    this.currentUses = currentUses;
    this.publicUrl = publicUrl;
  }
}
