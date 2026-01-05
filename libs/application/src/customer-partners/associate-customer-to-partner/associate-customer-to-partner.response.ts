import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de response para asociar un customer a un partner
 */
export class AssociateCustomerToPartnerResponse {
  @ApiProperty({ description: 'ID de la asociación creada', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID del usuario (customer)', example: 10 })
  userId: number;

  @ApiProperty({ description: 'ID del partner', example: 5 })
  partnerId: number;

  @ApiProperty({ description: 'ID del tenant', example: 1 })
  tenantId: number;

  @ApiProperty({ description: 'ID de la branch de registro', example: 5 })
  registrationBranchId: number;

  @ApiProperty({ description: 'Estado de la asociación', example: 'active' })
  status: string;

  @ApiProperty({ description: 'Fecha de asociación' })
  joinedDate: Date;

  @ApiProperty({ description: 'Fecha de última actividad', nullable: true })
  lastActivityDate: Date | null;

  @ApiProperty({ description: 'Metadatos adicionales', nullable: true })
  metadata: Record<string, any> | null;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;

  constructor(
    id: number,
    userId: number,
    partnerId: number,
    tenantId: number,
    registrationBranchId: number,
    status: string,
    joinedDate: Date,
    lastActivityDate: Date | null,
    metadata: Record<string, any> | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.userId = userId;
    this.partnerId = partnerId;
    this.tenantId = tenantId;
    this.registrationBranchId = registrationBranchId;
    this.status = status;
    this.joinedDate = joinedDate;
    this.lastActivityDate = lastActivityDate;
    this.metadata = metadata;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
