import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsObject, Min } from 'class-validator';

/**
 * Request para canjear puntos (redeem)
 */
export class RedeemPointsRequest {
  @ApiProperty({
    description: 'Código QR único del customer',
    example: 'QR-USER-10-TENANT-1-A3B5C7',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  qrCode: string;

  @ApiProperty({
    description: 'Cantidad de puntos a canjear',
    example: 100,
    type: Number,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  points: number;

  @ApiProperty({
    description: 'Descripción de la transacción',
    example: 'Canje de recompensa - Café gratis',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Metadata adicional de la transacción',
    example: {
      rewardId: 5,
      branchId: 5,
      cashierId: 10,
    },
    type: Object,
    required: false,
    nullable: true,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
