import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import {
  IInvitationCodeRepository,
  ITenantRepository,
  IBranchRepository,
  InvitationCode,
} from '@libs/domain';
import { CreateInvitationCodeRequest } from './create-invitation-code.request';
import { CreateInvitationCodeResponse } from './create-invitation-code.response';
import { generateInvitationCode, buildInvitationUrl } from '@libs/shared';
import { EmailService } from '@libs/infrastructure';

/**
 * Handler para el caso de uso de crear un código de invitación
 */
@Injectable()
export class CreateInvitationCodeHandler {
  private readonly logger = new Logger(CreateInvitationCodeHandler.name);

  constructor(
    @Inject('IInvitationCodeRepository')
    private readonly invitationCodeRepository: IInvitationCodeRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IBranchRepository')
    private readonly branchRepository: IBranchRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(
    request: CreateInvitationCodeRequest,
    createdBy: number,
  ): Promise<CreateInvitationCodeResponse> {
    // Validar que el tenant existe
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${request.tenantId} not found`);
    }

    // Si se proporciona branchId, validar que existe y pertenece al tenant
    if (request.branchId !== undefined && request.branchId !== null) {
      const branch = await this.branchRepository.findById(request.branchId);
      if (!branch) {
        throw new NotFoundException(`Branch with ID ${request.branchId} not found`);
      }
      if (branch.tenantId !== request.tenantId) {
        throw new BadRequestException(
          `Branch ${request.branchId} does not belong to tenant ${request.tenantId}`,
        );
      }
    }

    // Validar fecha de expiración si se proporciona
    let expiresAtDate: Date | null = null;
    if (request.expiresAt) {
      expiresAtDate = new Date(request.expiresAt);
      if (expiresAtDate <= new Date()) {
        throw new BadRequestException('Expiration date must be in the future');
      }
    }

    // Generar código único
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = generateInvitationCode();
      const existingCode = await this.invitationCodeRepository.findByCode(code);
      if (!existingCode) {
        break;
      }
      attempts++;
      if (attempts >= maxAttempts) {
        throw new BadRequestException(
          'Failed to generate unique invitation code after multiple attempts',
        );
      }
    } while (true);

    // Crear la entidad de dominio del código de invitación
    const invitationCode = InvitationCode.create(
      code,
      request.tenantId,
      createdBy,
      request.type || 'text',
      request.branchId || null,
      request.maxUses || null,
      expiresAtDate,
      'active',
    );

    // Guardar el código
    const savedCode = await this.invitationCodeRepository.save(invitationCode);

    // Construir URL pública (magic link)
    const publicUrl = buildInvitationUrl(savedCode.code);
    console.log('🚀 ~ CreateInvitationCodeHandler ~ execute ~ publicUrl:', publicUrl);

    // Determinar si se debe enviar email
    const shouldSendEmail = request.recipientEmail && request.sendEmail !== false; // Por defecto true si hay email

    let emailSent = false;

    // Enviar email si corresponde
    if (shouldSendEmail && request.recipientEmail) {
      try {
        await this.emailService.sendInvitationEmail(
          request.recipientEmail,
          savedCode.code,
          publicUrl,
          tenant,
          request.customMessage,
        );
        emailSent = true;
        this.logger.log(
          `Email de invitación enviado a ${request.recipientEmail} para código ${savedCode.code}`,
        );
      } catch (error) {
        // Log error pero no fallar la creación del código
        this.logger.error(
          `Error al enviar email de invitación a ${request.recipientEmail}:`,
          error,
        );
        // emailSent permanece false
      }
    }

    // Retornar response DTO
    return new CreateInvitationCodeResponse(
      savedCode.id,
      savedCode.code,
      savedCode.tenantId,
      savedCode.branchId,
      savedCode.type,
      savedCode.maxUses,
      savedCode.currentUses,
      savedCode.expiresAt,
      savedCode.status,
      savedCode.createdBy,
      savedCode.createdAt,
      savedCode.updatedAt,
      publicUrl,
      emailSent,
    );
  }
}
