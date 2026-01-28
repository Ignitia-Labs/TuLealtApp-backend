import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IInvitationCodeRepository, ITenantRepository } from '@libs/domain';
import { GetInvitationCodesRequest } from './get-invitation-codes.request';
import { GetInvitationCodesResponse } from './get-invitation-codes.response';
import { GetInvitationCodeResponse } from '../get-invitation-code/get-invitation-code.response';
import { buildInvitationUrl } from '@libs/shared';

/**
 * Handler para el caso de uso de obtener códigos de invitación de un tenant
 */
@Injectable()
export class GetInvitationCodesHandler {
  constructor(
    @Inject('IInvitationCodeRepository')
    private readonly invitationCodeRepository: IInvitationCodeRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(request: GetInvitationCodesRequest): Promise<GetInvitationCodesResponse> {
    // Validar que el tenant existe
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    // Obtener códigos según los filtros
    let codes;
    if (request.status === 'active') {
      codes = await this.invitationCodeRepository.findActiveByTenantId(request.tenantId);
    } else {
      codes = await this.invitationCodeRepository.findByTenantId(request.tenantId);
    }

    // Filtrar códigos expirados si no se incluyen
    if (!request.includeExpired) {
      const now = new Date();
      codes = codes.filter((code) => {
        if (code.expiresAt === null) {
          return true; // Sin expiración, incluir
        }
        return code.expiresAt > now; // Solo incluir si no ha expirado
      });
    }

    // Filtrar por status si se especifica
    if (request.status) {
      codes = codes.filter((code) => code.status === request.status);
    }

    // Convertir a DTOs de respuesta
    const codeResponses = codes.map((code) => {
      // Construir URL pública (magic link) para cada código
      const publicUrl = buildInvitationUrl(code.code);
      return new GetInvitationCodeResponse(
        code.id,
        code.code,
        code.tenantId,
        code.branchId,
        code.type,
        code.maxUses,
        code.currentUses,
        code.expiresAt,
        code.status,
        code.createdBy,
        code.createdAt,
        code.updatedAt,
        publicUrl,
      );
    });

    return new GetInvitationCodesResponse(codeResponses, codeResponses.length);
  }
}
