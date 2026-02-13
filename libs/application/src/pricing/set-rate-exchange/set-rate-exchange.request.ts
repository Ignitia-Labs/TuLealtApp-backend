import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO de request para establecer/actualizar el tipo de cambio
 */
export class SetRateExchangeRequest {
  @ApiProperty({
    description: 'Tasa de cambio (GTQ por USD). Ejemplo: 8 significa que 8 GTQ = 1 USD',
    example: 8,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  @IsNotEmpty()
  rate: number;
}
