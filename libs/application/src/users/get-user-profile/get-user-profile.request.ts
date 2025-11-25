import { IsNotEmpty, IsNumber } from 'class-validator';

/**
 * DTO de request para obtener el perfil de un usuario
 */
export class GetUserProfileRequest {
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
