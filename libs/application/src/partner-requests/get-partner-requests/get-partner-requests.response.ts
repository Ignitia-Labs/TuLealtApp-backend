import { ApiProperty } from '@nestjs/swagger';
import { GetPartnerRequestResponse } from '../get-partner-request/get-partner-request.response';

/**
 * DTO de response para obtener todas las solicitudes de partners
 */
export class GetPartnerRequestsResponse {
  @ApiProperty({
    description: 'Lista de solicitudes de partners',
    type: GetPartnerRequestResponse,
    isArray: true,
  })
  requests: GetPartnerRequestResponse[];

  @ApiProperty({
    description: 'Total de solicitudes',
    example: 10,
    type: Number,
  })
  total: number;

  constructor(requests: GetPartnerRequestResponse[], total: number) {
    this.requests = requests;
    this.total = total;
  }
}
