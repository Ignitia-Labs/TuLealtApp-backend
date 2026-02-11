import { ApiProperty } from '@nestjs/swagger';
import {
  TierInfoDto,
  TierPolicyDto,
} from '../../customer-memberships/dto/customer-membership.dto';

/**
 * DTO de response para obtener los partners de un customer
 * @deprecated Use GET /customer/memberships instead - Este endpoint será deprecado
 */
export class GetCustomerPartnersResponse {
  @ApiProperty({
    description: 'Lista de asociaciones customer-partner',
    type: Array,
  })
  partners: CustomerPartnerItem[];

  constructor(partners: CustomerPartnerItem[]) {
    this.partners = partners;
  }
}

export class CustomerPartnerItem {
  @ApiProperty({ description: 'ID de la asociación', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID del partner', example: 5 })
  partnerId: number;

  @ApiProperty({ description: 'Nombre del partner', example: 'Café Delicia' })
  partnerName: string;

  @ApiProperty({ description: 'ID del tenant', example: 1 })
  tenantId: number;

  @ApiProperty({ description: 'Nombre del tenant', example: 'Café Delicia - Centro' })
  tenantName: string;

  @ApiProperty({ description: 'ID de la branch de registro', example: 5 })
  registrationBranchId: number;

  @ApiProperty({ description: 'Nombre de la branch de registro', example: 'Sucursal Centro' })
  registrationBranchName: string;

  @ApiProperty({ description: 'Estado de la asociación', example: 'active' })
  status: string;

  @ApiProperty({ description: 'Fecha de asociación' })
  joinedDate: Date;

  @ApiProperty({ description: 'Fecha de última actividad', nullable: true })
  lastActivityDate: Date | null;

  @ApiProperty({ description: 'Metadatos adicionales', nullable: true })
  metadata: Record<string, any> | null;

  @ApiProperty({
    description: 'Información de los tiers del tenant',
    type: [TierInfoDto],
  })
  tiers: TierInfoDto[];

  @ApiProperty({
    description: 'Política de tiers del tenant',
    type: TierPolicyDto,
    nullable: true,
  })
  tierPolicy: TierPolicyDto | null;

  constructor(
    id: number,
    partnerId: number,
    partnerName: string,
    tenantId: number,
    tenantName: string,
    registrationBranchId: number,
    registrationBranchName: string,
    status: string,
    joinedDate: Date,
    lastActivityDate: Date | null,
    metadata: Record<string, any> | null,
    tiers: TierInfoDto[],
    tierPolicy: TierPolicyDto | null,
  ) {
    this.id = id;
    this.partnerId = partnerId;
    this.partnerName = partnerName;
    this.tenantId = tenantId;
    this.tenantName = tenantName;
    this.registrationBranchId = registrationBranchId;
    this.registrationBranchName = registrationBranchName;
    this.status = status;
    this.joinedDate = joinedDate;
    this.lastActivityDate = lastActivityDate;
    this.metadata = metadata;
    this.tiers = tiers;
    this.tierPolicy = tierPolicy;
  }
}
