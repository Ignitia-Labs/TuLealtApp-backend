import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para actualizar el status de una asociación customer-partner
 */
export class UpdateCustomerPartnerStatusResponse {
  @ApiProperty({ description: 'ID de la asociación', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID del usuario (customer)', example: 10 })
  userId: number;

  @ApiProperty({ description: 'ID del partner', example: 5 })
  partnerId: number;

  @ApiProperty({ description: 'Estado actualizado de la asociación', example: 'active' })
  status: string;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;

  constructor(id: number, userId: number, partnerId: number, status: string, updatedAt: Date) {
    this.id = id;
    this.userId = userId;
    this.partnerId = partnerId;
    this.status = status;
    this.updatedAt = updatedAt;
  }
}
