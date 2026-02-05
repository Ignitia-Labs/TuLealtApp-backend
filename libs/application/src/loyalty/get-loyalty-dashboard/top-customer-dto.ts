import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para top customers en el dashboard de lealtad
 */
export class TopCustomerDto {
  @ApiProperty({ example: 1, description: 'ID del usuario' })
  userId: number;

  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre del usuario' })
  userName: string;

  @ApiProperty({ example: 5000, description: 'Puntos totales del customer' })
  points: number;

  @ApiProperty({ example: 25, description: 'Número de transacciones del customer' })
  transactions: number;

  constructor(userId: number, userName: string, points: number, transactions: number) {
    this.userId = userId;
    this.userName = userName;
    this.points = points;
    this.transactions = transactions;
  }
}
