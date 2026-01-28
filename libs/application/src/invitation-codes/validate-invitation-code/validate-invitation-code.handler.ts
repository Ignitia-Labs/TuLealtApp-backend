import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IInvitationCodeRepository, ITenantRepository, IBranchRepository } from '@libs/domain';
import { ValidateInvitationCodeRequest } from './validate-invitation-code.request';
import { ValidateInvitationCodeResponse } from './validate-invitation-code.response';
import { buildInvitationUrl } from '@libs/shared';

/**
 * Handler para el caso de uso de validar un código de invitación
 * Este handler es público y permite al frontend validar códigos antes del registro
 */
@Injectable()
export class ValidateInvitationCodeHandler {
  constructor(
    @Inject('IInvitationCodeRepository')
    private readonly invitationCodeRepository: IInvitationCodeRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
  ) {}

  async execute(request: ValidateInvitationCodeRequest): Promise<ValidateInvitationCodeResponse> {
    // Buscar el código de invitación
    const invitationCode = await this.invitationCodeRepository.findByCode(request.code);

    if (!invitationCode) {
      return new ValidateInvitationCodeResponse(
        false,
        request.code,
        null,
        null,
        'Código de invitación no encontrado',
        null,
        null,
        0,
        buildInvitationUrl(request.code),
      );
    }

    // Validar el código
    const isValid = invitationCode.isValid();
    let message = 'Código válido';

    if (!isValid) {
      if (invitationCode.status === 'expired') {
        message = 'El código de invitación ha expirado';
      } else if (invitationCode.status === 'disabled') {
        message = 'El código de invitación está deshabilitado';
      } else if (
        invitationCode.maxUses !== null &&
        invitationCode.currentUses >= invitationCode.maxUses
      ) {
        message = 'El código de invitación ha alcanzado el límite de usos';
      } else if (invitationCode.expiresAt && invitationCode.expiresAt <= new Date()) {
        message = 'El código de invitación ha expirado';
      } else {
        message = 'El código de invitación no es válido';
      }
    }

    // Obtener información del tenant
    let tenantInfo = null;
    if (invitationCode.tenantId) {
      const tenant = await this.tenantRepository.findById(invitationCode.tenantId);
      if (tenant) {
        tenantInfo = {
          id: tenant.id,
          name: tenant.name,
          logo: tenant.logo,
          description: tenant.description,
          primaryColor: tenant.primaryColor,
          secondaryColor: tenant.secondaryColor,
        };
      }
    }

    // Obtener información de la branch si existe
    let branchInfo = null;
    if (invitationCode.branchId) {
      const branch = await this.branchRepository.findById(invitationCode.branchId);
      if (branch) {
        branchInfo = {
          id: branch.id,
          name: branch.name,
        };
      }
    }

    // Construir URL pública
    const publicUrl = buildInvitationUrl(invitationCode.code);

    return new ValidateInvitationCodeResponse(
      isValid,
      invitationCode.code,
      tenantInfo,
      branchInfo,
      message,
      invitationCode.expiresAt,
      invitationCode.maxUses,
      invitationCode.currentUses,
      publicUrl,
    );
  }
}
