import { ApiProperty } from '@nestjs/swagger';
import { PeriodDto } from '../../loyalty/get-loyalty-dashboard/period-dto';

export class NewCustomersGroupDto {
  @ApiProperty({
    example: 'Sem 1',
    description: 'Etiqueta del período (ej: "Sem 1", "2026-01-01", "Enero 2026")',
  })
  label: string;

  @ApiProperty({ example: '2026-01-01', description: 'Fecha de inicio del período' })
  startDate: string;

  @ApiProperty({ example: '2026-01-07', description: 'Fecha de fin del período' })
  endDate: string;

  @ApiProperty({ example: 12, description: 'Número de nuevos clientes en este período' })
  count: number;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'Número de semana (si groupBy="week")',
  })
  weekNumber?: number;

  @ApiProperty({
    example: 'Enero',
    required: false,
    description: 'Nombre del mes (si groupBy="month")',
  })
  monthName?: string;

  constructor(
    label: string,
    startDate: string,
    endDate: string,
    count: number,
    weekNumber?: number,
    monthName?: string,
  ) {
    this.label = label;
    this.startDate = startDate;
    this.endDate = endDate;
    this.count = count;
    this.weekNumber = weekNumber;
    this.monthName = monthName;
  }
}

export class GetNewCustomersResponse {
  @ApiProperty({
    type: [NewCustomersGroupDto],
    description: 'Agrupación de nuevos clientes',
  })
  newCustomers: NewCustomersGroupDto[];

  @ApiProperty({ example: 66, description: 'Total de nuevos clientes en el período' })
  total: number;

  @ApiProperty({ type: PeriodDto, description: 'Período consultado' })
  period: PeriodDto;

  constructor(newCustomers: NewCustomersGroupDto[], total: number, period: PeriodDto) {
    this.newCustomers = newCustomers;
    this.total = total;
    this.period = period;
  }
}
