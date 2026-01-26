import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para procesar una solicitud de partner
 */
export class ProcessPartnerRequestResponse {
  @ApiProperty({
    description: 'ID del partner creado',
    example: 1,
    type: Number,
  })
  partnerId: number;

  @ApiProperty({
    description: 'ID de la solicitud procesada',
    example: 1,
    type: Number,
  })
  requestId: number;

  @ApiProperty({
    description: 'Estado actualizado de la solicitud',
    example: 'enrolled',
    enum: ['enrolled'],
  })
  requestStatus: string;

  @ApiProperty({
    description: 'Nombre del partner creado',
    example: 'Restaurante La Cocina del Sol',
    type: String,
  })
  partnerName: string;

  @ApiProperty({
    description: 'Email del partner',
    example: 'roberto@cocinasol.gt',
    type: String,
  })
  partnerEmail: string;

  @ApiProperty({
    description: 'Dominio del partner',
    example: 'cocinasol.gt',
    type: String,
  })
  partnerDomain: string;

  @ApiProperty({
    description: 'Código único de búsqueda rápida para el partner (para QR code)',
    example: 'PARTNER-ABC234',
    type: String,
  })
  partnerQuickSearchCode: string;

  constructor(
    partnerId: number,
    requestId: number,
    requestStatus: string,
    partnerName: string,
    partnerEmail: string,
    partnerDomain: string,
    partnerQuickSearchCode: string,
  ) {
    this.partnerId = partnerId;
    this.requestId = requestId;
    this.requestStatus = requestStatus;
    this.partnerName = partnerName;
    this.partnerEmail = partnerEmail;
    this.partnerDomain = partnerDomain;
    this.partnerQuickSearchCode = partnerQuickSearchCode;
  }
}
