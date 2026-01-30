import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, IsEnum } from 'class-validator';

/**
 * DTO de request para actualizar una membership (PATCH - parcial)
 */
export class UpdateCustomerMembershipRequest {
  @ApiProperty({
    description: 'ID de la membership a actualizar',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  membershipId: number;

  /**
   * @deprecated Este campo está deprecado. Los puntos NO deben actualizarse directamente.
   * Los puntos son una proyección calculada desde el ledger (points_transactions).
   * Para cambiar puntos, use el sistema de ledger con PointsTransaction.
   * Este campo será removido en una versión futura.
   * @see PointsTransaction
   */
  @ApiProperty({
    description:
      'DEPRECATED: Puntos a actualizar (opcional). NO USE ESTE CAMPO. Los puntos se actualizan automáticamente desde el ledger.',
    example: 2000,
    type: Number,
    minimum: 0,
    required: false,
    deprecated: true,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  points?: number;

  @ApiProperty({
    description: 'ID del tier a actualizar (opcional)',
    example: 2,
    type: Number,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  tierId?: number | null;

  @ApiProperty({
    description: 'Total gastado a actualizar (opcional)',
    example: 3500.75,
    type: Number,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  totalSpent?: number;

  @ApiProperty({
    description: 'Total de visitas a actualizar (opcional)',
    example: 30,
    type: Number,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  totalVisits?: number;

  @ApiProperty({
    description: 'Fecha de última visita a actualizar (opcional)',
    example: '2024-01-20T10:30:00.000Z',
    type: Date,
    required: false,
    nullable: true,
  })
  @IsOptional()
  lastVisit?: Date | null;

  @ApiProperty({
    description: 'Estado a actualizar (opcional)',
    example: 'active',
    enum: ['active', 'inactive'],
    required: false,
  })
  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: 'active' | 'inactive';
}
