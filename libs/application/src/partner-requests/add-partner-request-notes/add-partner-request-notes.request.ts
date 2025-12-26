import { IsNumber, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de request para agregar notas a una solicitud de partner
 */
export class AddPartnerRequestNotesRequest {
  @ApiProperty({
    description: 'ID de la solicitud',
    example: 1,
    type: Number,
  })
  @IsNumber()
  requestId: number;

  @ApiProperty({
    description: 'Notas a agregar o actualizar',
    example: 'Revisando documentación fiscal',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  notes: string;
}
