import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO de request para establecer/actualizar el tipo de cambio
 */
export class SetRateExchangeRequest {
  @ApiProperty({
    description: 'Tasa de cambio (GTQ por USD). Ejemplo: 7.85 significa que 7.85 GTQ = 1 USD',
    example: 7.85,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  @IsNotEmpty()
  rate: number;
}
