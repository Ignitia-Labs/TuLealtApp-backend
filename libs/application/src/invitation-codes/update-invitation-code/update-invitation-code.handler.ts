import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  IInvitationCodeRepository,
  ITenantRepository,
  IBranchRepository,
  InvitationCode,
} from '@libs/domain';
import { UpdateInvitationCodeRequest } from './update-invitation-code.request';
import { UpdateInvitationCodeResponse } from './update-invitation-code.response';

/**
 * Handler para el caso de uso de actualizar un código de invitación
 */
@Injectable()
export class UpdateInvitationCodeHandler {
  constructor(
    @Inject('IInvitationCodeRepository')
    private readonly invitationCodeRepository: IInvitationCodeRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
  ) {}

  async execute(
    id: number,
    request: UpdateInvitationCodeRequest,
  ): Promise<UpdateInvitationCodeResponse> {
    // Buscar el código existente
    const existingCode = await this.invitationCodeRepository.findById(id);

    if (!existingCode) {
      throw new NotFoundException(`Invitation code with ID ${id} not found`);
    }

    // Si se proporciona branchId, validar que existe y pertenece al tenant
    if (request.branchId !== undefined) {
      if (request.branchId !== null) {
        const branch = await this.branchRepository.findById(request.branchId);
        if (!branch) {
          throw new NotFoundException(`Branch with ID ${request.branchId} not found`);
        }
        if (branch.tenantId !== existingCode.tenantId) {
          throw new BadRequestException(
            `Branch ${request.branchId} does not belong to tenant ${existingCode.tenantId}`,
          );
        }
      }
    }

    // Validar fecha de expiración si se proporciona
    const expiresAtDate: Date | null = request.expiresAt
      ? new Date(request.expiresAt)
      : existingCode.expiresAt;

    if (expiresAtDate && expiresAtDate <= new Date()) {
      throw new BadRequestException('Expiration date must be in the future');
    }

    // Crear código actualizado con valores nuevos o existentes
    // La entidad es inmutable, así que creamos una nueva instancia
    const updatedCode = new InvitationCode(
      existingCode.id,
      existingCode.code,
      existingCode.tenantId,
      request.branchId !== undefined ? request.branchId : existingCode.branchId,
      existingCode.type,
      request.maxUses !== undefined ? request.maxUses : existingCode.maxUses,
      existingCode.currentUses,
      expiresAtDate,
      request.status !== undefined ? request.status : existingCode.status,
      request.blocked !== undefined ? request.blocked : existingCode.blocked,
      existingCode.createdBy,
      existingCode.createdAt,
      new Date(),
    );

    // Guardar el código actualizado
    const savedCode = await this.invitationCodeRepository.update(updatedCode);

    // Retornar response DTO
    return new UpdateInvitationCodeResponse(
      savedCode.id,
      savedCode.code,
      savedCode.tenantId,
      savedCode.branchId,
      savedCode.type,
      savedCode.maxUses,
      savedCode.currentUses,
      savedCode.expiresAt,
      savedCode.status,
      savedCode.blocked,
      savedCode.createdBy,
      savedCode.createdAt,
      savedCode.updatedAt,
    );
  }
}
