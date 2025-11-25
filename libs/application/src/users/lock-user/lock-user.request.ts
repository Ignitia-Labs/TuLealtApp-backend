import { IsNotEmpty, IsNumber } from 'class-validator';

/**
 * DTO de request para bloquear un usuario
 */
export class LockUserRequest {
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
