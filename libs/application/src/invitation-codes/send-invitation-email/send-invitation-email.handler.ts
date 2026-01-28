import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import {
  IInvitationCodeRepository,
  ITenantRepository,
} from '@libs/domain';
import { SendInvitationEmailRequest } from './send-invitation-email.request';
import { SendInvitationEmailResponse } from './send-invitation-email.response';
import { buildInvitationUrl } from '@libs/shared';
import { EmailService } from '@libs/infrastructure';

/**
 * Handler para el caso de uso de re-enviar email de invitación
 */
@Injectable()
export class SendInvitationEmailHandler {
  private readonly logger = new Logger(SendInvitationEmailHandler.name);

  constructor(
    @Inject('IInvitationCodeRepository')
    private readonly invitationCodeRepository: IInvitationCodeRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(
    invitationCodeId: number,
    request: SendInvitationEmailRequest,
  ): Promise<SendInvitationEmailResponse> {
    // Obtener el código de invitación
    const invitationCode = await this.invitationCodeRepository.findById(invitationCodeId);
    if (!invitationCode) {
      throw new NotFoundException(`Invitation code with ID ${invitationCodeId} not found`);
    }

    // Obtener el tenant para información del email
    const tenant = await this.tenantRepository.findById(invitationCode.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${invitationCode.tenantId} not found`);
    }

    // Construir URL pública (magic link)
    const publicUrl = buildInvitationUrl(invitationCode.code);

    // Enviar email
    let emailSent = false;
    try {
      await this.emailService.sendInvitationEmail(
        request.recipientEmail,
        invitationCode.code,
        publicUrl,
        tenant,
        request.customMessage,
      );
      emailSent = true;
      this.logger.log(
        `Email de invitación re-enviado a ${request.recipientEmail} para código ${invitationCode.code}`,
      );
    } catch (error) {
      this.logger.error(
        `Error al re-enviar email de invitación a ${request.recipientEmail}:`,
        error,
      );
      throw error; // Lanzar error para que el controller pueda manejarlo
    }

    return new SendInvitationEmailResponse(
      invitationCode.id,
      request.recipientEmail,
      emailSent,
      publicUrl,
    );
  }
}
