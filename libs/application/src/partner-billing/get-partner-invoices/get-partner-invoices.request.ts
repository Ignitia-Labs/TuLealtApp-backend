import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceStatus } from '@libs/domain';

/**
 * Request DTO para obtener el historial de facturas del partner
 */
export class GetPartnerInvoicesRequest {
  @ApiProperty({
    description: 'ID del partner',
    example: 1,
  })
  @IsInt()
  partnerId: number;

  @ApiProperty({
    description: 'Filtrar por estado de la factura',
    enum: ['pending', 'paid', 'overdue', 'cancelled'],
    required: false,
    example: 'paid',
  })
  @IsOptional()
  @IsEnum(['pending', 'paid', 'overdue', 'cancelled'])
  status?: InvoiceStatus;

  @ApiProperty({
    description: 'Número de página (ignorado si all=true)',
    required: false,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiProperty({
    description: 'Registros por página, máximo 100 (ignorado si all=true)',
    required: false,
    minimum: 1,
    maximum: 100,
    example: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @ApiProperty({
    description:
      'Si es true, retorna todos los registros sin paginación. Límite máximo: 1000 registros.',
    required: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  all?: boolean;
}
