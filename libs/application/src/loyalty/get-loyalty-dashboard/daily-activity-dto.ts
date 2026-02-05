import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para actividad diaria en el dashboard de lealtad
 * Representa la actividad agregada por día de los últimos 7 días
 */
export class DailyActivityDto {
  @ApiProperty({
    example: '2025-01-27',
    description: 'Fecha en formato ISO 8601 (YYYY-MM-DD)',
  })
  date: string;

  @ApiProperty({
    example: 1,
    description: 'Día de la semana: 0 = Domingo, 1 = Lunes, ..., 6 = Sábado',
  })
  dayOfWeek: number;

  @ApiProperty({
    example: 'mon',
    description: 'Nombre corto del día: "mon", "tue", "wed", "thu", "fri", "sat", "sun"',
  })
  dayName: string;

  @ApiProperty({
    example: 450,
    description: 'Total de puntos ganados ese día',
  })
  pointsEarned: number;

  @ApiProperty({
    example: 200,
    description: 'Total de puntos canjeados ese día',
  })
  pointsRedeemed: number;

  constructor(
    date: string,
    dayOfWeek: number,
    dayName: string,
    pointsEarned: number,
    pointsRedeemed: number,
  ) {
    this.date = date;
    this.dayOfWeek = dayOfWeek;
    this.dayName = dayName;
    this.pointsEarned = pointsEarned;
    this.pointsRedeemed = pointsRedeemed;
  }
}
