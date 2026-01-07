import { ApiProperty } from '@nestjs/swagger';
import { TransactionDto } from '../get-transactions/get-transactions.response';

/**
 * Response para acumular puntos
 */
export class EarnPointsResponse {
  @ApiProperty({
    description: 'Transacción creada',
    type: TransactionDto,
  })
  transaction: TransactionDto;

  @ApiProperty({ description: 'Nuevo balance de puntos del customer', example: 1650 })
  newBalance: number;

  @ApiProperty({ description: 'ID del tier actualizado', example: 2, nullable: true })
  tierId: number | null;

  @ApiProperty({ description: 'Nombre del tier actualizado', example: 'Oro', nullable: true })
  tierName: string | null;

  constructor(
    transaction: TransactionDto,
    newBalance: number,
    tierId: number | null,
    tierName: string | null,
  ) {
    this.transaction = transaction;
    this.newBalance = newBalance;
    this.tierId = tierId;
    this.tierName = tierName;
  }
}
