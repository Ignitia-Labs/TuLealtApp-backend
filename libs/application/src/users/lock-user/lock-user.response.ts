/**
 * DTO de response para bloquear un usuario
 */
export class LockUserResponse {
  id: number;
  isActive: boolean;
  updatedAt: Date;

  constructor(id: number, isActive: boolean, updatedAt: Date) {
    this.id = id;
    this.isActive = isActive;
    this.updatedAt = updatedAt;
  }
}
