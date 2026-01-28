import { ApiProperty } from '@nestjs/swagger';
import { GetInvitationCodeResponse } from '../get-invitation-code/get-invitation-code.response';

/**
 * DTO de response para obtener códigos de invitación de un tenant
 */
export class GetInvitationCodesResponse {
  @ApiProperty({
    description: 'Lista de códigos de invitación',
    type: [GetInvitationCodeResponse],
  })
  codes: GetInvitationCodeResponse[];

  @ApiProperty({
    description: 'Total de códigos encontrados',
    example: 10,
    type: Number,
  })
  total: number;

  constructor(codes: GetInvitationCodeResponse[], total: number) {
    this.codes = codes;
    this.total = total;
  }
}
