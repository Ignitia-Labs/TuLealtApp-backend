import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para documentación Swagger de BillingPeriodPrice
 */
export class PricingPeriodSwaggerDto {
  @ApiProperty({
    example: 19,
    nullable: true,
    description: 'Precio mensual en USD',
  })
  monthly: number | null;

  @ApiProperty({
    example: 54,
    nullable: true,
    description: 'Precio trimestral en USD (total por 3 meses)',
  })
  quarterly: number | null;

  @ApiProperty({
    example: 102,
    nullable: true,
    description: 'Precio semestral en USD (total por 6 meses)',
  })
  semiannual: number | null;

  @ApiProperty({
    example: 182,
    nullable: true,
    description: 'Precio anual en USD (total por 12 meses)',
  })
  annual: number | null;
}

