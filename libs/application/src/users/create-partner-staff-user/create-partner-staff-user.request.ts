import { IsNumber, IsArray, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateUserRequest } from '../create-user/create-user.request';

/**
 * DTO de request para crear un usuario PARTNER_STAFF
 * Extiende CreateUserRequest y agrega partnerId requerido y profileIds opcional
 */
export class CreatePartnerStaffUserRequest extends CreateUserRequest {
  @ApiProperty({
    description: 'ID del partner al que pertenece el usuario',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  partnerId: number;

  @ApiProperty({
    description: 'IDs de los perfiles a asignar al usuario',
    example: [1, 2],
    type: [Number],
    required: false,
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  profileIds?: number[];
}

