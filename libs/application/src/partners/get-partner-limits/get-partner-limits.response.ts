import { ApiProperty } from '@nestjs/swagger';
import { PartnerLimitsSwaggerDto } from '../dto/partner-limits-swagger.dto';

/**
 * DTO de response para obtener los límites de un partner
 */
export class GetPartnerLimitsResponse {
  @ApiProperty({
    description: 'ID único del registro de límites',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID único del partner',
    example: 1,
    type: Number,
  })
  partnerId: number;

  @ApiProperty({
    description: 'Límites del partner',
    type: PartnerLimitsSwaggerDto,
  })
  limits: PartnerLimitsSwaggerDto;

  @ApiProperty({
    description: 'Fecha de creación del registro de límites',
    example: '2024-01-01T00:00:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del registro de límites',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
  })
  updatedAt: Date;

  constructor(
    id: number,
    partnerId: number,
    limits: PartnerLimitsSwaggerDto,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.partnerId = partnerId;
    this.limits = limits;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
