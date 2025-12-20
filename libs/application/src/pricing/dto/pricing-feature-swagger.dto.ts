import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para documentación Swagger de PricingFeature
 */
export class PricingFeatureSwaggerDto {
  @ApiProperty({ example: 'f1', description: 'ID único de la característica' })
  id: string;

  @ApiProperty({
    example: 'Clientes ilimitados',
    description: 'Texto descriptivo de la característica',
  })
  text: string;

  @ApiProperty({
    example: true,
    description: 'Si la característica está habilitada',
  })
  enabled: boolean;
}

