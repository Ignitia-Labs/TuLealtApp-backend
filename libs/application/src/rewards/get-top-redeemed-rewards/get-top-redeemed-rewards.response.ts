import { ApiProperty } from '@nestjs/swagger';
import { PeriodDto } from '../../loyalty/get-loyalty-dashboard/period-dto';

export class TopRedeemedRewardDto {
  @ApiProperty({ example: 1, description: 'ID de la recompensa' })
  rewardId: number;

  @ApiProperty({ example: 'Café Gratis', description: 'Nombre de la recompensa' })
  name: string;

  @ApiProperty({
    example: 'Disfruta un café gratis en cualquier sucursal',
    description: 'Descripción de la recompensa',
  })
  description: string;

  @ApiProperty({ example: 500, description: 'Costo en puntos para canjear esta recompensa' })
  pointsCost: number;

  @ApiProperty({ example: 25, description: 'Número de veces que fue canjeada en el período' })
  timesRedeemed: number;

  @ApiProperty({ example: '☕', required: false, description: 'Icono/emoji asociado a la recompensa' })
  icon?: string;

  @ApiProperty({
    example: 'https://example.com/reward.jpg',
    required: false,
    description: 'URL de imagen de la recompensa',
  })
  imageUrl?: string;

  @ApiProperty({ example: 5, description: 'ID del programa de lealtad al que pertenece' })
  programId: number;

  @ApiProperty({ example: 'Programa Base', description: 'Nombre del programa de lealtad' })
  programName: string;

  @ApiProperty({
    example: 15.5,
    required: false,
    description: 'Tendencia vs período anterior (porcentaje de cambio)',
  })
  trend?: number;

  constructor(
    rewardId: number,
    name: string,
    description: string,
    pointsCost: number,
    timesRedeemed: number,
    programId: number,
    programName: string,
    icon?: string,
    imageUrl?: string,
    trend?: number,
  ) {
    this.rewardId = rewardId;
    this.name = name;
    this.description = description;
    this.pointsCost = pointsCost;
    this.timesRedeemed = timesRedeemed;
    this.programId = programId;
    this.programName = programName;
    this.icon = icon;
    this.imageUrl = imageUrl;
    this.trend = trend;
  }
}

export class GetTopRedeemedRewardsResponse {
  @ApiProperty({ type: [TopRedeemedRewardDto], description: 'Lista de recompensas más canjeadas' })
  rewards: TopRedeemedRewardDto[];

  @ApiProperty({ type: PeriodDto, description: 'Período consultado' })
  period: PeriodDto;

  constructor(rewards: TopRedeemedRewardDto[], period: PeriodDto) {
    this.rewards = rewards;
    this.period = period;
  }
}
