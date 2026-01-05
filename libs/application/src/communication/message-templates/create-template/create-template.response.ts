import { ApiProperty } from '@nestjs/swagger';
import { MessageTemplateType } from '@libs/domain';

/**
 * DTO de response para crear una plantilla de mensaje
 */
export class CreateTemplateResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Recordatorio de Pago' })
  name: string;

  @ApiProperty({ example: 'payment_reminder' })
  type: MessageTemplateType;

  @ApiProperty({ example: 'Recordatorio: Pago de Suscripción Pendiente' })
  subject: string;

  @ApiProperty({ example: 'Hola {{partnerName}},...' })
  body: string;

  @ApiProperty({ example: ['partnerName', 'amount', 'currency'] })
  variables: string[];

  @ApiProperty({ example: 0 })
  usageCount: number;

  @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: 1, nullable: true })
  createdBy: number | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  constructor(
    id: number,
    name: string,
    type: MessageTemplateType,
    subject: string,
    body: string,
    variables: string[],
    usageCount: number,
    createdAt: Date,
    updatedAt: Date,
    createdBy: number | null,
    isActive: boolean,
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.subject = subject;
    this.body = body;
    this.variables = variables;
    this.usageCount = usageCount;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.createdBy = createdBy;
    this.isActive = isActive;
  }
}
